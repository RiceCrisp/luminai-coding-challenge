let extensionStatus = 'RUN';

type TRequest = {
  message: 'getStock' | 'submitForm';
  data?: unknown;
};

type TResponse1 = {
  name: string;
  percentChange: string;
};

type TResponse2 = {
  message: string;
};

type TErrorResponse = {
  error: string;
};

chrome.runtime.onInstalled.addListener(() => {
  updateStatus('RUN');
});

chrome.action.onClicked.addListener(async (tab) => {
  if (extensionStatus === '...') {
    return;
  }
  try {
    updateStatus('...');
    // CNBC
    const nbcTab = await updateTab('https://www.cnbc.com/us-market-movers/');
    const res1 = await chrome.tabs.sendMessage<
      TRequest,
      TResponse1 | TErrorResponse
    >(nbcTab.id!, { message: 'getStock' });
    if ('error' in res1) {
      throw new Error(res1.error);
    }
    // Zoho
    const formTab = await updateTab('https://tinyurl.com/mtpzcucb');
    const res2 = await chrome.tabs.sendMessage<
      TRequest,
      TResponse2 | TErrorResponse
    >(formTab.id!, { message: 'submitForm', data: res1 });
    if ('error' in res2) {
      throw new Error(res2.error);
    } else if (res2.message === 'success') {
      updateStatus('DONE');
    }
  } catch (err) {
    const error = err as Error;
    console.log(`Error: ${error.message}`);
    updateStatus('ERR');
  }
});

function updateStatus(s: string) {
  extensionStatus = s;
  chrome.action.setBadgeText({
    text: s,
  });
}

function updateTab(url: string) {
  return new Promise<chrome.tabs.Tab>((resolve) => {
    chrome.tabs.update({ url }, async (tab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        chrome.action.setBadgeText({
          text: extensionStatus,
        });
        if (tab && info.status === 'complete' && tabId === tab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve(tab);
        }
      });
    });
  });
}
