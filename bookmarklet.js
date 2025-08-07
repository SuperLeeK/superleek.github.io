
javascript: (function () {
  const values = [
    'https://superleek.github.io',
    'https://superleek.github.io/counselor-list.html',
    'https://superleek.github.io/detail-280.html',
		'https://superleek.github.io/detail-148.html',
		'https://superleek.github.io/detail-452.html',
		'https://superleek.github.io/detail-318.html',
		'https://superleek.github.io/detail-415.html',
		'https://superleek.github.io/detail-178.html',
		'https://superleek.github.io/detail-488.html',
		'https://superleek.github.io/detail-489.html',
		'https://superleek.github.io/detail-492.html',
		'https://superleek.github.io/detail-244.html'
  ].flat();
  const inputSelector = '#input-209';
  const buttonSelector = '#app > div > main > div > div:nth-child(2) > div:nth-child(2) > div > div.row.mt-5.pb-12.justify-space-between > div.pb-0.col-md-9.col-12 > div.container.pa-0.white > div.row.api_box.px-6.pt-8.pb-4.no-gutters > div.container.pa-0 > div > div:nth-child(1) > div.mt-3.col.col-12 > div > div.row.d-flex-wrap.no-gutters.align-center > div.pl-6.col.col-auto > button';

  async function processValue(value, index) {
    const input = document.querySelector(inputSelector);
    if (input) {
      input.focus();
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const button = document.querySelector(buttonSelector);
    if (button) {
      button.click();
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async function processAll() {
    console.log('Starting batch processing...');

    for (let i = 0; i < values.length; i++) {
      await processValue(values[i], i);
    }

    console.log('All processing completed! bye');
  }

  processAll();
})();
