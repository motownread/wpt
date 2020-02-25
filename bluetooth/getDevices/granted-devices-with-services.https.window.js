// META: script=/resources/testdriver.js
// META: script=/resources/testdriver-vendor.js
// META: script=/bluetooth/resources/bluetooth-helpers.js
'use strict';
const test_desc = 'getDevices() resolves with permitted devices that can be ' +
    'GATT connected to.';

bluetooth_test(async () => {
  let fake_central =
      await navigator.bluetooth.test.simulateCentral({state: 'powered-on'});

  // Get a Bluetooth device with permission to access its 'health_thermometer'
  // service.
  await getDevice(
      {
        filters:
            [{name: 'Health Thermometer', services: ['health_thermometer']}]
      },
      {
        address: '00:00:00:00:00:00',
        name: 'Health Thermometer',
        knownServiceUUIDs: ['health_thermometer']
      },
      fake_central);

  let devices = await navigator.bluetooth.getDevices();
  assert_equals(
      devices.length, 1,
      `getDevices() should return the 'Health Thermometer' device.`);
  try {
    await devices[0].gatt.getPrimaryService('health_thermometer');
  } catch (err) {
    assert_unreached(`${err.name}: ${err.message}`);
  }

  // Get a second Bluetooth device with permission to access its
  // 'health_thermometer' service, but not its 'heart_rate' service.
  await getDevice(
      {
        filters: [{
          name: 'Health Monitor',
          acceptAllServices: true,
        }],
        optionalServices: ['health_thermometer']
      },
      {
        address: '00:00:00:00:00:01',
        name: 'Health Monitor',
        knownServiceUUIDs: ['heart_rate', 'health_thermometer']
      },
      fake_central);

  devices = await navigator.bluetooth.getDevices();
  assert_equals(
      devices.length, 2,
      `getDevices() should return the 'Health Thermometer' and 'Health ` +
          `Monitor' devices`);
  try {
    for (let device of devices) {
      await device.gatt.getPrimaryService('health_thermometer');
      assert_promise_rejects_with_message(
          device.gatt.getPrimaryService('heart_rate'), {name: 'SecurityError'});
    }
  } catch (err) {
    assert_unreached(`${err.name}: ${err.message}`);
  }
}, test_desc);