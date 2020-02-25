// META: title=data URL shared worker in data URL context
// META: script=/service-workers/service-worker/resources/test-helpers.sub.js
const mimeType = 'application/javascript';

// Tests creating a data URL shared worker in a data URL iframe.
promise_test(async t => {
  const nestedWorkerScriptURL =
      new URL('/workers/support/post-message-on-load-worker.js', location.href);

  // This code will be executed as a data URL iframe. The iframe tries to create
  // a shared worker from |nestedWorkerScriptURL|, but that should result in a
  // failure. This is because the data URL iframe has an opaque origin, and
  // script fetch is handled as a cross-origin request.
  const frameCode = `
      <script>
      const postMessage = window.parent.postMessage;
      try {
        const worker = new SharedWorker('${nestedWorkerScriptURL}');
        worker.port.onmessage = e => {
          window.parent.postMessage(
              'SharedWorker construction unexpectedly succeeded', '*');
        };
        worker.onerror = e => window.parent.postMessage('PASS', '*');
      } catch (e) {
        // Cross-origin request should asynchronously fail during worker script
        // fetch due to its request mode is 'same-origin'.
        window.parent.postMessage(
            'SharedWorker construction unexpectedly synchronously failed', '*');
      }
      </script>
  `;

  const frame = await with_iframe(`data:text/html;base64,${btoa(frameCode)}`);
  const result = await new Promise(r => window.onmessage = e => r(e.data));
  assert_equals(result, 'PASS');
}, 'Create a shared worker in a data url frame');

// Tests creating a data URL shared worker in a data URL iframe.
promise_test(async t => {
  const workerCode = `onconnect = e => e.ports[0].postMessage("PASS");`;

  // This code will be executed as a data URL iframe. The iframe creates a data
  // URL shared worker, and posts the result to the parent frame.
  const frameCode = `
      <script>
      try {
        const worker = new SharedWorker('data:${mimeType},${workerCode};');
        worker.port.onmessage = e => window.parent.postMessage(e.data, '*');
        worker.onerror = e => window.parent.postMessage(e.message, '*');
      } catch (e) {
        window.parent.postMessage(
            'Worker construction unexpectedly synchronously failed', '*');
      }
      </script>
  `;

  const frame = await with_iframe(`data:text/html;base64,${btoa(frameCode)}`);
  const result = await new Promise(r => window.onmessage = e => r(e.data));
  assert_equals(result, 'PASS');
}, 'Create a data url shared worker in a data url frame');
