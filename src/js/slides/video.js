/**
 * Set slide video
 *
 * @param {node} slide
 * @param {object} data
 * @param {int} index
 * @param {function} callback
 */
import { has, closest, injectAssets, addClass, removeClass, createHTML, isFunction, waitUntil, checkVideoUrl, checkVideoSource, isLocalVideo } from '../utils/helpers.js';

export default function slideVideo(slide, data, index, callback) {
    const slideContainer = slide.querySelector('.ginner-container');
    const videoID = 'gvideo' + index;
    const slideMedia = slide.querySelector('.gslide-media');
    const videoPlayers = this.getAllPlayers();

    addClass(slideContainer, 'gvideo-container');

    slideMedia.insertBefore(createHTML('<div class="gvideo-wrapper"></div>'), slideMedia.firstChild);

    const videoWrapper = slide.querySelector('.gvideo-wrapper');

    injectAssets(this.settings.plyr.css, 'Plyr');

    let url = data.href;
    let protocol = location.protocol.replace(':', '');
    let videoSource = '';
    let embedID = '';
    let customPlaceholder = false;

    if (protocol == 'file') {
        protocol = 'http';
    }
    slideMedia.style.maxWidth = data.width;

    injectAssets(this.settings.plyr.js, 'Plyr', () => {

        const videoType = checkVideoUrl(url);
        let videoSource = checkVideoSource(data);

        // Set vimeo videos
        if (videoType === 'vimeo' || videoSource === 'vimeo') {
            const vimeoID = /vimeo.*\/(\d+)/i.exec(url);
            embedID = vimeoID[1];
        }

        // Set youtube videos
        if (videoType === 'youtube' || videoSource === 'youtube') {
            const youtubeID = getYoutubeID(url);
            embedID = youtubeID;
        }

        // Set local videos
        if (videoType === 'local' || videoSource === 'local') {
            let html = '<video id="' + videoID + '" ';
            html += `style="background:#000; max-width: ${data.width};" `;
            html += 'preload="metadata" ';
            html += 'x-webkit-airplay="allow" ';
            html += 'webkit-playsinline="" ';
            html += 'controls ';
            html += 'class="gvideo-local">';

            let format = url.toLowerCase().split('.').pop();
            let sources = { mp4: '', ogg: '', webm: '' };
            let sourceFormat = data.videoSource;
            format = format == 'mov' ? 'mp4' : format;

            if (format in sources) {
                sources[format] = url;
            } else if (sourceFormat in sources) {
                sources[sourceFormat] = url;
            }

            for (let key in sources) {
                if (sources.hasOwnProperty(key)) {
                    let videoFile = sources[key];
                    if (data.hasOwnProperty(key)) {
                        videoFile = data[key];
                    }
                    if (videoFile !== '') {
                        html += `<source src="${videoFile}" type="video/${key}">`;
                    }
                }
            }
            html += '</video>';
            customPlaceholder = createHTML(html);
        }

        videoSource = videoType;

        // prettier-ignore
        const placeholder = customPlaceholder ? customPlaceholder : createHTML(`<div id="${videoID}" data-plyr-provider="${videoSource}" data-plyr-embed-id="${embedID}"></div>`);

        addClass(videoWrapper, `${videoSource}-video gvideo`);
        videoWrapper.appendChild(placeholder);
        videoWrapper.setAttribute('data-id', videoID);
        videoWrapper.setAttribute('data-index', index);

        const playerConfig = has(this.settings.plyr, 'config') ? this.settings.plyr.config : {};
        const player = new Plyr('#' + videoID, playerConfig);

        player.on('ready', (event) => {
            const instance = event.detail.plyr;
            videoPlayers[videoID] = instance;
            if (isFunction(callback)) {
                callback();
            }
        });
        waitUntil(
            () => {
                return slide.querySelector('iframe') && slide.querySelector('iframe').dataset.ready == 'true';
            },
            () => {
                this.resize(slide);
            }
        );
        player.on('enterfullscreen', handleMediaFullScreen);
        player.on('exitfullscreen', handleMediaFullScreen);
    });
}

/**
 * Get youtube ID
 *
 * @param {string} url
 * @returns {string} video id
 */
function getYoutubeID(url) {
    let videoID = '';
    url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    if (url[2] !== undefined) {
        videoID = url[2].split(/[^0-9a-z_\-]/i);
        videoID = videoID[0];
    } else {
        videoID = url;
    }
    return videoID;
}

/**
 * Handle fullscreen
 *
 * @param {object} event
 */
function handleMediaFullScreen(event) {
    const media = closest(event.target, '.gslide-media');

    if (event.type == 'enterfullscreen') {
        addClass(media, 'fullscreen');
    }
    if (event.type == 'exitfullscreen') {
        removeClass(media, 'fullscreen');
    }
}
