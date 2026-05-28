import {CONFIG} from "./config.js";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    chrome.storage.local.get(['gem_api'], (result) => {
        const userKey = result.gem_api;

        if (request.action === "getYTData"){
            const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${request.id}&key=${CONFIG.YT_api}`;

            fetch(url)
                .then(res=>res.json()).then(data => {
                    if (data.error){
                        sendResponse({success: false, error: data.error.message});
                    } else {
                        sendResponse({success: true, data: data});
                    }
                })
                .catch(err => sendResponse({success: false, error: err.message}));
        }
        if (request.action === "getAISummary"){
            if (!userKey) {
                sendResponse({success:false, error: "Please set your Gemini API Key in the extension popup!!"});
                return;
            }

            fetchSummary(request.id, request.title, request.author, request.description, userKey, sender.tab.id).then(summary => sendResponse({success: true, summary}))
                .catch(err => sendResponse({success: false, error: err.message}));
        }
    });

    return true;
});


async function fetchSummary(videoId, title, author, description, apiKey, tabID){


    let transcript = null;
    if (tabID) {
        transcript = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tabID, {action: "getTranscript", videoId}, (response) => {

                if (response?.success && response.xml?.trimStart().startsWith('<?xml')) {

                    const full = response.xml.replace(/<text/g, ' ').replace(/<[^>]*>/g, ' ')
                    .replace(/&amp;#39;/g, "'").replace(/&amp;quot;/g, '"').replace(/\s+/g, ' ')
                    .trim()

                    const chunk = 4000;
                    const cleaned  = full.length <= chunk * 5
                        ? full 
                        : [
                            full.slice(0, chunk), 
                            full.slice(Math.floor(full.length * 0.25), Math.floor(full.length * 0.25) + chunk),
                            full.slice(Math.floor(full.length * 0.50), Math.floor(full.length * 0.50) + chunk),
                            full.slice(Math.floor(full.length * 0.75), Math.floor(full.length * 0.75) + chunk),
                            full.slice(-chunk)
                        ].join(" ... ");
                    
                        resolve(cleaned)
                } 
                
                else{
                    resolve(null);
                }
            });
        });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`

    const safeDesc = (description || "").replace(/https?:\/\/\S+/g, '').substring(0,500);
    const prompt = `
 You are an expert content analyst.

Your goal is to determine the most important information a viewer would gain from watching this video.

Inputs:
Author: ${author}
Title: ${title}
Description: ${safeDesc}
Transcript: ${transcript || "N/A"}

Rules:

1. If a transcript exists, rely primarily on the transcript.
2. Use title and description only as supporting context.
3. Do not infer facts that are not present in the provided content.
4. Extract the central takeaway, finding, recommendation, argument, or result.
5. For tutorials, summarize what the viewer learns.
6. For reviews, summarize the verdict.
7. For news, summarize the key development.
8. For discussions, summarize the strongest takeaway.
9. Ignore sponsorships, introductions, jokes, and filler.
10. Avoid phrases like:
   - "The video discusses..."
   - "The creator talks about..."
   - "This video explores..."
11. Be direct and specific.
12. Avoid repeating ideas.
13. Do not mention the author or channel.

Return ONLY valid JSON.

Schema:

{
"summary": "string",
"titleAccuracy" : number,
"clickbaitScore" : number,
"confidence": number
}

Additionally evaluate:

1. Title Accuracy
 - does the title accurately represent the content?
 - score 0-100.

2. Clickbait Score
- score 0-100
- 0 = Completely honest.
- 100 = highly misleading.

3. Confidence
- Score 0-100
- Reflect confidence based on transcript quality and available info.
    `;

    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            contents: [{parts: [{text: prompt}] }],
            generationConfig: {
                temperature: 0.1,
                topP: 0.8,
                topK: 40,
                responseMimeType: "application/json"
            }
        })
    });
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);

    if (!data.candidates || !data.candidates[0].content){
        throw new Error("Gemnini returned an empty response :(");
    }

    const raw =  data.candidates[0].content.parts[0].text;

    try {
        return JSON.parse(raw)
    }
    catch (err) {
        return{
            summary: raw,
            titleAccuracy: null,
            clickbaitScore: null,
            confidence: null
        };
    }
}