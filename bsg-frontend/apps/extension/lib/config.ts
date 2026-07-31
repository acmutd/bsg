const PRODUCTION_SERVER_URL = 'https://api.binarysearchgang.com';
const PRODUCTION_RTC_URL = 'wss://api.binarysearchgang.com/ws';

let _serverUrl = 'http://localhost:3000' //process.env.NEXT_PUBLIC_SERVER_URL || PRODUCTION_SERVER_URL;
let _rtcUrl = 'ws://localhost:5001/ws' //process.env.NEXT_PUBLIC_RTC_SERVICE_URL || PRODUCTION_RTC_URL;

let _resolve!: () => void;
export const configReady: Promise<void> = new Promise<void>((resolve) => {
  _resolve = resolve;
});

if (typeof chrome !== 'undefined' && chrome.storage?.local) {
  chrome.storage.local.get(['configServerUrl', 'configRtcServiceUrl'], (result) => {
    if (result.configServerUrl) _serverUrl = result.configServerUrl;
    if (result.configRtcServiceUrl) _rtcUrl = result.configRtcServiceUrl;
    _resolve();
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;
    if (changes.configServerUrl) _serverUrl = changes.configServerUrl.newValue;
    if (changes.configRtcServiceUrl) _rtcUrl = changes.configRtcServiceUrl.newValue;
  });
} else {
  _resolve();
}

export function getServerUrl(): string { return _serverUrl; }
export function getRtcUrl(): string { return _rtcUrl; }
