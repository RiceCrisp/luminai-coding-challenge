import { retry, retryAsync } from 'ts-retry';

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.message === 'getStock') {
    retryAsync(
      async () => {
        const tabs = getElementOrThrow('.MarketMoversMenu-moverContainer');
        let nasdaqTab = null;
        for (let i = 0; i < tabs.children.length; i++) {
          const child = tabs.children[i] as HTMLElement;
          nasdaqTab =
            child.innerText.toLowerCase() === 'nasdaq' ? child : nasdaqTab;
        }
        if (!nasdaqTab) {
          throw new Error('Element not found.');
        }
        if (!nasdaqTab.classList.contains('.MarketMoversMenu-activeMarket')) {
          nasdaqTab.click();
          await delay(100);
        }
        const nameEl = getElementOrThrow(
          '.MarketTop-topTable > tbody > tr:nth-child(2) .MarketTop-name'
        );
        const percentEl = getElementOrThrow(
          '.MarketTop-topTable > tbody > tr:nth-child(2) .MarketTop-quoteChange'
        );
        const name = nameEl.innerText;
        const percentChange = percentEl.innerText;
        if (!name || !percentChange) {
          throw new Error('Element not found.');
        }
        return { name, percentChange };
      },
      { delay: 1000, maxTry: 10 }
    )
      .then((res) => {
        sendResponse(res);
      })
      .catch((err) => {
        const error = err as Error;
        sendResponse({ error: error.message });
      });
  } else if (req.message === 'submitForm') {
    retry(
      () => {
        const nameInput = getElementOrThrow<HTMLFormElement>(
          'form#test input[name=SingleLine]'
        );
        const percentInput = getElementOrThrow<HTMLFormElement>(
          'form#test input[name=SingleLine1]'
        );
        const timeInput = getElementOrThrow<HTMLFormElement>(
          'form#test input[name=SingleLine2]'
        );
        const submitButton = getElementOrThrow<HTMLFormElement>(
          'form#test button.fmSmtButtom'
        );
        nameInput.value = req.data.name;
        percentInput.value = req.data.percentChange.slice(0, -1);
        timeInput.value = Date.now();
        submitButton.click()
        return { message: 'success' };
      },
      { delay: 1000, maxTry: 10 }
    )
      .then((res) => {
        sendResponse(res);
      })
      .catch((err) => {
        const error = err as Error;
        sendResponse({ error: error.message });
      });
  }
  return true;
});

function getElementOrThrow<T extends Element = HTMLElement>(selector: string) {
  const el = document.querySelector<T>(selector);
  if (!el) {
    throw new Error('Element not found.');
  }
  return el;
}

function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

console.log('Content script works!');
