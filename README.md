[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/) ![Version](https://img.shields.io/badge/Version-0.1--Beta-00f?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-System--Online-00f?style=for-the-badge)
![Manifest](https://img.shields.io/badge/Manifest-V3-orange?style=for-the-badge)
[![CommitCraft](https://img.shields.io/badge/Powered_by-CommitCraft-0078d7?style=for-the-badge&logo=github)](https://github.com/SukhdevThukral/CommitCraft)
# Hover Tube (v0.1)

stop wasting your time on clickbaits and random videos. HoverTube is an extension that uses Gemini AI to analyse transcripts and metadata, delivering a 1-2 sentence conclusion the moment you hover over a YouTube link anywhere on the internet!!

<img width="800" height="450" alt="hovertube-demo-1779979251639-ezgif com-video-to-gif-converter" src="https://github.com/user-attachments/assets/e82c0c7a-8d91-4012-ace3-852990016df9" />

## Installation

Not on the Chrome Web Store yet but you can sideload it in 30 seconds:

1. Download or clone this repo
```
git clone https://github.com/SukhdevThukral/Hover-Tube.git
```
2. Go to `chrome://extensions`
3. Enable **Developer Mode** (toggle, top right)
4. Click **Load unpacked**
5. Select the downloaded folder
6. Then open the extension popup, paste your Gemini API key, and you're done.

> Get a free API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

## Features

- AI conclusion : It's powered by Gemini-2.5-Flash (BYOK Model: Bring Your Own Key)
- Transcript extraction: Scrapes and cleans YouTube captions realtime to feed accurate context to the LLM
- Gives clickbait and title accuracy data


## Tech Stack

**Logic:** JavaScript(ES6+), Chrome Extension API (Manifest v3)

**AI:** Google Gemini API

**Data:** YouTube Data API v3

**Frontend:** GSAP(GreenSock Animation Platform), CSS
## Roadmap

- [x] v0.1-Beta (core engine)

- [ ] Smart Caching

- [ ] Contextual Modes

- [ ] One-Click Save


## Acknowledgements

 - [GSAP (GreenSock)](https://gsap.com/docs/v3/)
 - [Awesome README](readme.so)
 - [YouTube Data API](https://developers.google.com/youtube/v3)


## Feedback

If you have any feedback, please reach out at sukhdevthukral2411@gmail.com

## Contributing

Contributions are greatly appreciated!

#### How to Contribute
- Fork the Project 🍴

- Create your Feature Branch (git checkout -b feature/AmazingFeature)

- Commit your Changes (git commit -m 'Add some AmazingFeature')

    *pro-tip: Use CommitCraft for perfect commit messages*

- Push to the Branch (git push origin feature/AmazingFeature)

- Open a Pull Request 🚀


## License

[MIT](https://choosealicense.com/licenses/mit/)

