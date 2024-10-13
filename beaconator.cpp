/**
 * @file beaconator.cpp
 * @brief Header file for beaconator functionality.
 * @author Italo C.J. Soares (italocjs@live.com)
 *
 * This file contains declarations related to beaconator functionality.
 *
 * @version 1.0.1
 * @date  2024-04-19 14:44:58 - Bruno - doxygen documentation improved
 * 2024-04-25 13:26:18 - Bruno - doxygen documentation improved
 *
 * @copyright Copyright (c) 2024
 */
// #include "beaconator.h"

// #include "api.h"
/**
 * @brief Update function for BeaconMokoM3 class.
 *
 * This function is supposed to perform all the required calibration and averaging processes.
 * It should be called as much as possible in the loop and will only run when it's time.
 *
 * @return true if the update is successful, false otherwise.
 */
/* #region The beaconator M3 is an helper class to get all info needed from the adv data */

bool BeaconMokoM3::update()
{
	// This is supposed to to all the required calibration and averaging process. this function should be called as much as possible in the
	// loop and will only run when its time.

	return true;
}

/**
 * @brief Set the averaging time for BeaconMokoM3 class.
 *
 * @param time_ms The averaging time in milliseconds.
 * @return int 0 on success.
 */
int BeaconMokoM3::set_averaging_time(int time_ms)
{
	averaging_time_ms = time_ms;
	return 0;
}

/**
 * @brief Set the MAC address for BeaconMokoM3 class.
 *
 * @param macAddress Pointer to the MAC address array.
 * @return true if setting the MAC address is successful, false otherwise.
 */
bool BeaconMokoM3::set_mac_address(uint8_t *macAddress)
{
	memcpy(this->macAddress, macAddress, 6);
	return true;
}
/**
 * @brief Process the received beacon package.
 *
 * This function checks if the MAC address of the received beacon matches the MAC address
 * set for the BeaconMokoM3 instance. If they match, it extracts and updates the data.
 *
 * @param beaconData Pointer to the BeaconData structure containing the received beacon data.
 * @return true if the MAC address matches and data is updated, false otherwise.
 */
bool BeaconMokoM3::process_package(BeaconData *beaconData)    // Process package
{
	const uint8_t *scan_mac = beaconData->address;
	const uint8_t *wanted_mac = this->macAddress;
	int mcp = memcmp(wanted_mac, scan_mac, 6);
	if (mcp != 0)
	{
		return false;    // is not the mac we are looking for
	}
	// ESP_LOGW("BLE_DEBUG", "process_package: MAC address match");
	extract_and_update_data(beaconData);
	return true;
}

// #include <algorithm>    // For std::sort and std::vector
// #include <vector>

/**
 * @brief Calculate the simple average of a vector of integers.
 *
 * This function calculates the average of the values in the provided vector.
 *
 * @param data Vector of integers containing the data to be averaged.
 * @return The simple average of the values in the vector, scaled down by 100.0f to match the unit.
 *         If the input vector is empty, returns 0.0f to guard against division by zero.
 */
float BeaconMokoM3::calculateAverage(const std::vector<int16_t> &data)    // Function to calculate simple average of a vector
{
	if (data.empty()) return 0.0f;    // Guard against division by zero

	float sum = 0.0f;
	for (int value : data)
	{
		sum += value;
	}
	return (sum / data.size()) / 100.0f;    // Scale down by 100.0f to match the unit
}

/**
 * @brief Calculate the filtered mean of a vector of integers.
 *
 * This function sorts the input vector, removes the top and bottom 10% of the data,
 * and then calculates the mean of the remaining 80%.
 *
 * @param data Vector of integers containing the data to be filtered.
 * @return The filtered mean of the values in the vector, scaled down by 100.0f to match the unit.
 */
float BeaconMokoM3::calculateFilteredMean(std::vector<int16_t> &data)
{
	// Sort the data
	std::sort(data.begin(), data.end());

	// Calculate the indices to cut off the top and bottom 10%
	size_t removeCount = data.size() / 15;
	size_t start = removeCount;
	size_t end = data.size() - removeCount;

	// Calculate the mean of the remaining 80%
	float sum = 0.0f;
	for (size_t i = start; i < end; ++i)
	{
		sum += data[i];
	}
	float mean = sum / (end - start) / 100.0f;    // Don't forget to scale down by 100.0f

	return mean;
}

/**
 * @brief Extract and update data from a beacon packet.
 *
 * This function extracts battery voltage and accelerometer data from the given beacon packet
 * and updates the corresponding member variables.
 *
 * @param beaconData Pointer to the BeaconData structure containing the beacon packet.
 */
void BeaconMokoM3::extract_and_update_data(BeaconData *beaconData)
{
	moko_acc_packet_t *parsed_data = (moko_acc_packet_t *)beaconData->payload.data();

	// get the battery voltage
	battery_voltage = 256 * parsed_data->data.battery_voltage[0] + parsed_data->data.battery_voltage[1];

	// get the accelerometer data as uint16_t and convert to int16_t for proper sign handling
	x_raw_signed = static_cast<int16_t>((parsed_data->data.sensor_data[0] << 8) | parsed_data->data.sensor_data[1]);
	y_raw_signed = static_cast<int16_t>((parsed_data->data.sensor_data[2] << 8) | parsed_data->data.sensor_data[3]);
	z_raw_signed = static_cast<int16_t>((parsed_data->data.sensor_data[4] << 8) | parsed_data->data.sensor_data[5]);

	x = x_raw_signed / 100.0f;
	y = y_raw_signed / 100.0f;
	z = z_raw_signed / 100.0f;

	// Store raw signed values for averaging
	x_vector.push_back(x_raw_signed);
	y_vector.push_back(y_raw_signed);
	z_vector.push_back(z_raw_signed);

	//This function checks if it's time to perform averaging based on the specified averaging time.
	if ((averaging_time_ms != -1) && elapsed_since(averaging_tracker, averaging_time_ms))
	{
		sample_size = x_vector.size();
		// Filter and calculate the average only if we have enough samples
		if (x_vector.size() > 10)    // Enough data to filter using mean at 10% percentile
		{
			x_avg = calculateFilteredMean(x_vector);
			y_avg = calculateFilteredMean(y_vector);
			z_avg = calculateFilteredMean(z_vector);
			// print the mac address of the beacon using  beaconData->address
			ESP_LOGI("BLE_DEBUG",
			         "Beaconator mean: MAC: %02X:%02X:%02X:%02X:%02X:%02X | x_avg: %2.3f, y_avg: %2.3f, z_avg: %2.3f, sample_size: %d",
			         (unsigned)beaconData->address[0], (unsigned)beaconData->address[1], (unsigned)beaconData->address[2],
			         (unsigned)beaconData->address[3], (unsigned)beaconData->address[4], (unsigned)beaconData->address[5], x_avg, y_avg,
			         z_avg, x_vector.size());
		}
		else    // Not enough data, use simple averaging
		{
			x_avg = calculateAverage(x_vector);
			y_avg = calculateAverage(y_vector);
			z_avg = calculateAverage(z_vector);
			ESP_LOGW("BLE_DEBUG",
			         "Beaconator average: MAC: %02X:%02X:%02X:%02X:%02X:%02X | x_avg: %2.3f, y_avg: %2.3f, z_avg: %2.3f, sample_size: %d",
			         (unsigned)beaconData->address[0], (unsigned)beaconData->address[1], (unsigned)beaconData->address[2],
			         (unsigned)beaconData->address[3], (unsigned)beaconData->address[4], (unsigned)beaconData->address[5], x_avg, y_avg,
			         z_avg, x_vector.size());
		}

		// Clear the vectors after calculating the mean
		x_vector.clear();
		y_vector.clear();
		z_vector.clear();

		timestamp_avg = millis();
	}
	timestamp = millis();
}

/* #endregion */

// #include <NimBLEDevice.h>

// #include "communications.h"
NimBLEScan *pBLEScan;
QueueHandle_t beaconator_queue;    // Needed to receive data from callback

/**
 * @brief Callback function triggered upon receiving advertisement data.
 *
 * This function is invoked when advertisement data is received from a BLE device.
 * It creates a new BeaconData object and extracts the MAC address of the advertised device.
 * The MAC address bytes are reversed and stored in the BeaconData object.
 *
 * @param advertisedDevice Pointer to the BLEAdvertisedDevice object containing advertisement data.
 * @return None.
 */
class MyAdvertisedDeviceCallbacks : public BLEAdvertisedDeviceCallbacks
{
	void onResult(BLEAdvertisedDevice *advertisedDevice)
	{
		BeaconData *data = new BeaconData;
		NimBLEAddress bleAddress = advertisedDevice->getAddress();
		const uint8_t *nativeAddr = bleAddress.getNative();
		// Reverse the order of MAC address bytes as they are copied
		for (int i = 0; i < 6; ++i)
		{
			data->address[i] = nativeAddr[5 - i];
		}

		data->rssi = advertisedDevice->getRSSI();

		// Copy payload
		const uint8_t *payload = advertisedDevice->getPayload();
		size_t length = advertisedDevice->getPayloadLength();
		data->payload = std::vector<uint8_t>(payload, payload + length);    // Copy payload data into the vector

		if (xQueueSend(beaconator_queue, &data, portMAX_DELAY) != pdPASS)
		{
			ESP_LOGW("NimBLE RX", "Failed to send to queue");
			delete data;    // Important to avoid memory leaks if queue send fails
		}

		pBLEScan->clearResults();    // Consider the implications of this call here
	}
};

// AT+BLEMAC02=00:00:00:00:00:00
// AT+BLEMAC01=CC:55:31:BA:D1:E0
// AT+INCL_CALIB

BeaconMokoM3 device_ble_01;
BeaconMokoM3 device_ble_02;

TaskHandle_t beaconTaskHandle;


// #include <map>
// #include <array>
// #include <cstring> // for memcpy

struct BLEDeviceInfo {
    int rssi;
    unsigned int package_count;
    unsigned long last_millis;
};
std::map<std::array<uint8_t, 6>, BLEDeviceInfo> bleDevices;
void processBLEPackage(const BeaconData* beaconData) {
    std::array<uint8_t, 6> macArray;
    std::memcpy(macArray.data(), beaconData->address, 6);

    auto it = bleDevices.find(macArray);
    if (it != bleDevices.end()) {
        // Update existing entry
        it->second.rssi = beaconData->rssi;
        it->second.package_count++;
        it->second.last_millis = millis();
    } else {
        // Add new entry
        BLEDeviceInfo newDevice;
        newDevice.rssi = beaconData->rssi;
        newDevice.package_count = 1;
        newDevice.last_millis = millis();
        bleDevices[macArray] = newDevice;
    }
}

unsigned long lastPrintTime = 0;

void checkAndPrintSummary() {
    if (millis() - lastPrintTime >= 5000) { // 10 seconds
        for (const auto &entry : bleDevices) {
            const auto &mac = entry.first;
            const BLEDeviceInfo &info = entry.second;
            ESP_LOGI("BLE_SUMMARY", "AT+BLEDBG MAC: %02X:%02X:%02X:%02X:%02X:%02X, Last RSSI: %d, Package Count: %u, Last Seen: %lu ms ago",
                     mac[0], mac[1], mac[2], mac[3], mac[4], mac[5],
                     info.rssi, info.package_count, millis() - info.last_millis);

			if (api.device_info.device_connected == 1)
			{
				reply_to_source("AT+BLEDBG >MAC: %02X:%02X:%02X:%02X:%02X:%02X, Last RSSI: %d, Package Count: %u, Last Seen: %lu ms ago\r\n", BLE_UART,
				                 mac[0], mac[1], mac[2], mac[3], mac[4], mac[5],
				                 info.rssi, info.package_count, millis() - info.last_millis);
			}
        }
        lastPrintTime = millis();
    }
}



/**
 * @brief Beacon task for scanning BLE advertisements.
 *
 * This task initializes BLE scanning and sets up callbacks to handle BLE advertisement data.
 * It configures the BLE scan parameters and starts the scanning process.
 * Additionally, it sets the MAC addresses for two BeaconMokoM3 devices.
 *
 * @param pvParameters Pointer to task parameters (not used).
 * @return None.
 */
void BeaconatorTask(void *pvParameters)
{
	delay(1000);    // wait to make sure the BLE stack is ready
	ESP_LOGI("NimBLE RX", "BeaconatorTask starting, current free heap: %d, minimum free heap: %d", esp_get_free_heap_size(),
	         esp_get_minimum_free_heap_size());

	pBLEScan = NimBLEDevice::getScan();
	pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks(), true);    // Set wantDuplicates
	pBLEScan->setFilterPolicy(BLE_HCI_SCAN_FILT_NO_WL);
	pBLEScan->setMaxResults(0);    // do not store the scan results, use callback only.

	device_ble_01.set_averaging_time(3000);
	device_ble_02.set_averaging_time(3000);

	device_ble_01.set_mac_address(api.ble01.memory_mac);
	uint8_t last_mac_01[6];
	memcpy(last_mac_01, api.ble01.memory_mac, 6);
	ESP_LOGI("NimBLE RX", "STARTING WITH Beacon 01 MAC: %02X:%02X:%02X:%02X:%02X:%02X", (unsigned)api.ble01.memory_mac[0],
	         (unsigned)api.ble01.memory_mac[1], (unsigned)api.ble01.memory_mac[2], (unsigned)api.ble01.memory_mac[3],
	         (unsigned)api.ble01.memory_mac[4], (unsigned)api.ble01.memory_mac[5]);

	device_ble_02.set_mac_address(api.ble02.memory_mac);
	uint8_t last_mac_02[6];
	memcpy(last_mac_02, api.ble02.memory_mac, 6);
	ESP_LOGI("NimBLE RX", "STARTING WITH Beacon 02 MAC: %02X:%02X:%02X:%02X:%02X:%02X", (unsigned)api.ble02.memory_mac[0],
	         (unsigned)api.ble02.memory_mac[1], (unsigned)api.ble02.memory_mac[2], (unsigned)api.ble02.memory_mac[3],
	         (unsigned)api.ble02.memory_mac[4], (unsigned)api.ble02.memory_mac[5]);

	while (1)
	{
		vTaskDelay(5);    // avoid 100% CPU usage

		/* #region Make sure scanning is always active */
		if (pBLEScan->isScanning() == false)
		{
			pBLEScan->start(0, nullptr, false);
		}
		/* #endregion */

		/* #region Process data */
		BeaconData *beaconData = nullptr;
		if (xQueueReceive(beaconator_queue, &beaconData, portMAX_DELAY) == pdPASS && beaconData != nullptr)
		{
			// print data about the received data
			//  ESP_LOGI("NimBLE RX", "Received data from MAC: %02X:%02X:%02X:%02X:%02X:%02X, RSSI: %d", (unsigned)beaconData->address[0],
			//  (unsigned)beaconData->address[1], (unsigned)beaconData->address[2], (unsigned)beaconData->address[3],
			//  (unsigned)beaconData->address[4], (unsigned)beaconData->address[5], beaconData->rssi);

			if (api.device_info.ble_scanner_debug)
			{
				processBLEPackage(beaconData);
				checkAndPrintSummary();
			}

			if (device_ble_01.process_package(beaconData))
			{
				// ESP_LOGI("BLE_DEBUG", "process_package: MAC address matches");
				api.ble01.x = device_ble_01.x;
				api.ble01.y = device_ble_01.y;
				api.ble01.z = device_ble_01.z;

				api.ble01.x_avg = device_ble_01.x_avg;
				api.ble01.y_avg = device_ble_01.y_avg;
				api.ble01.z_avg = device_ble_01.z_avg;

				api.ble01.battery = device_ble_01.battery_voltage;
				api.ble01.sample_size = device_ble_01.sample_size;
				// api.ble01.timestamp = device_ble_01.timestamp;
				api.ble01.timestamp_avg = device_ble_01.timestamp_avg;
				api.ble01.timestamp = millis();
			}
			else if (device_ble_02.process_package(beaconData))
			{
				api.ble02.x = device_ble_02.x;
				api.ble02.y = device_ble_02.y;
				api.ble02.z = device_ble_02.z;

				api.ble02.x_avg = device_ble_02.x_avg;
				api.ble02.y_avg = device_ble_02.y_avg;
				api.ble02.z_avg = device_ble_02.z_avg;

				api.ble02.battery = device_ble_02.battery_voltage;
				api.ble02.sample_size = device_ble_02.sample_size;
				// api.ble02.timestamp = device_ble_02.timestamp;
				api.ble02.timestamp_avg = device_ble_02.timestamp_avg;
				api.ble02.timestamp = millis();
			}
			delete beaconData;
		}
		/* #endregion */

		/* #region Make sure the device mac changes if api changes */

		/**
		 * @brief Updates the MAC addresses of beacon devices if they have changed.
		 *
		 * This function compares the MAC addresses stored in memory with the last known MAC addresses.
		 * If any changes are detected, it updates the MAC addresses of the corresponding beacon devices.
		 *
		 * @param device_ble_01 The first beacon device.
		 * @param device_ble_02 The second beacon device.
		 * @param last_mac_01 The last known MAC address of the first beacon device.
		 * @param last_mac_02 The last known MAC address of the second beacon device.
		 * @param api.ble01.memory_mac The current MAC address of the first beacon device stored in memory.
		 * @param api.ble02.memory_mac The current MAC address of the second beacon device stored in memory.
		 */
		if (memcmp(api.ble01.memory_mac, last_mac_01, 6) != 0)
		{
			device_ble_01.set_mac_address(api.ble01.memory_mac);
			memcpy(last_mac_01, api.ble01.memory_mac, 6);
		}

		if (memcmp(api.ble02.memory_mac, last_mac_02, 6) != 0)
		{
			device_ble_02.set_mac_address(api.ble02.memory_mac);
			memcpy(last_mac_02, api.ble02.memory_mac, 6);
		}
		/* #endregion */
	}
}

/**
 * @brief Sets up the NimBLE beacon task and queue.
 *
 * This function creates the NimBLE beacon task and initializes the queue used for communication with the task.
 *
 * @return esp_err_t Returns ESP_OK if the setup is successful, otherwise ESP_FAIL.
 */
esp_err_t setup_beaconator()
{
	// BaseType_t beacon_task_created =
	//     xTaskCreate(BeaconatorTask, "BeaconatorTask", STACK_SIZE_NIMBLE_BEACON, NULL, PRIORITY_NIMBLE_BEACON, &beaconTaskHandle);
	BaseType_t beacon_task_created = xTaskCreatePinnedToCore(BeaconatorTask, "BeaconatorTask", TASK_NIMBLE_BEACON_STACK_SIZE, NULL,
	                                                         TASK_NIMBLE_BEACON_PRIORITY, &beaconTaskHandle, TASK_NIMBLE_BEACON_CORE);

	if (beacon_task_created != pdPASS)
	{
		ESP_LOGE("Nimble NUS", "Failed to create BeaconatorTask");
		return ESP_FAIL;    // Indicate task creation failure
	}

	beaconator_queue = xQueueCreate(5, sizeof(BeaconData *));

	if (beaconator_queue == NULL)
	{
		ESP_LOGE("BEACONATOR", "Failed to create queue");
		return ESP_FAIL;
	}

	return ESP_OK;
}
