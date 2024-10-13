/**
 * @file beaconator.h
 * @brief Header file for beaconator functionality.
 * @author Italo C.J. Soares (italocjs@live.com)
 * 
 * This file contains declarations related to beaconator functionality.
 * 
 * @version 1.0.1
 * @date  2024-04-19 14:44:58 - Bruno - doxygen documentation improved
 * 2024-04-25 13:26:59 - Bruno - doxygen documentation improved
 * 
 * @copyright Copyright (c) 2024
 */
#pragma once

#include <cmath>      // for atan2 and M_PI
#include <cstdio>     // for printf
#include <cstring>    // for memcpy
#include <vector>

#include "config.h"
#include "port_tools.h"    // for ElapsedTimeChecker
// #include "core_lib.h"
// #include "esp_gap_ble_api.h"

extern QueueHandle_t beaconator_queue;    // Needed to receive data from callback

/**
 * @brief Structure representing beacon data.
 * 
 * This structure contains information about a detected beacon, including its MAC address, signal strength (RSSI),
 * and payload data.
 */
typedef struct
{
	uint8_t address[6];              // Device MAC address
	int rssi;                        // Signal strength
	std::vector<uint8_t> payload;    // Payload data, up to 255 bytes
} BeaconData;

/**
 * @brief Class for managing Moko M3 beacons.
 * 
 * This class provides functionality for updating beacon data, processing packages, setting averaging time,
 * and managing MAC addresses.
 */
class BeaconMokoM3

{
   public:
    /**
     * @brief Updates the beacon data by performing averaging and calibration processes.
     * 
     * This function calculates the average values for acceleration and battery voltage,
     * and delivers the result to the API.
     * 
     * @return true if the update process is successful, false otherwise.
     */
	bool update();	// This will run all the averaging and calibration process, then deliver the result to the API
	 /**
     * @brief Processes a received package of beacon data.
     * 
     * This function processes the received beacon data package and extracts relevant information.
     * 
     * @param beaconData Pointer to the beacon data structure.
     * @return true if the package is successfully processed, false otherwise.
     */
	bool process_package(BeaconData *beaconData);
	  /**
     * @brief Sets the averaging time for accelerometer data.
     * 
     * This function sets the time duration over which accelerometer data is averaged.
     * 
     * @param time_ms The averaging time in milliseconds.
     * @return 0 if the averaging time is set successfully, -1 otherwise.
     */
	int set_averaging_time(int time_ms);
	 /**
     * @brief Sets the MAC address of the beacon.
     * 
     * This function sets the MAC address of the beacon for identification purposes.
     * 
     * @param macAddress Pointer to the array containing the MAC address.
     * @return true if the MAC address is set successfully, false otherwise.
     */
	bool set_mac_address(uint8_t *macAddress);
	int16_t x_raw_signed, y_raw_signed, z_raw_signed;    // raw values from the device, not calculated into angle or averaged
	float x, y, z;  /**< Current accelerometer values. */
	float x_avg, y_avg, z_avg, battery_voltage;  /**< Averaged accelerometer values and battery voltage. */

	int sample_size; /**< Number of samples used for averaging. */
	unsigned long timestamp;    // keep track of the last time the beacon was updated
	unsigned long timestamp_avg;    // keep track of the last time the beacon was averaged

   private:
	int averaging_time_ms = -1;    // -1 means sample disabled, this MUST be enabled by the user
	uint8_t macAddress[6]; /**< MAC address of the beacon. */
	 /**
     * @brief Extracts relevant data from the received beacon package and updates internal state.
     * 
     * This function extracts relevant data such as acceleration values from the received beacon package
     * and updates the internal state of the beacon.
     * 
     * @param beaconData Pointer to the beacon data structure.
     */
	void extract_and_update_data(BeaconData *beaconData);
	 /**
     * @brief Calculates the filtered mean of the given data.
     * 
     * This function calculates the filtered mean of the given data using a predefined algorithm.
     * 
     * @param data Vector containing the data for which the filtered mean is to be calculated.
     * @return The calculated filtered mean.
     */
	float calculateFilteredMean(std::vector<int16_t> &data);
	 /**
     * @brief Calculates the average of the given data.
     * 
     * This function calculates the average of the given data.
     * 
     * @param data Vector containing the data for which the average is to be calculated.
     * @return The calculated average.
     */
	float calculateAverage(const std::vector<int16_t> &data);

	unsigned long averaging_tracker = 0;    // Last time the beacon was averaged

	std::vector<int16_t> x_vector; /**< Vector to store x-axis acceleration data. */
	std::vector<int16_t> y_vector; /**< Vector to store y-axis acceleration data. */
	std::vector<int16_t> z_vector; /**< Vector to store z-axis acceleration data. */

	struct moko_acc_header_t
	{
		uint8_t flags[3];  /**< Flags for indicating packet information. */
		uint8_t tx_power_level[3]; /**< Transmit power level. */
		uint8_t length;   /**< Length of the packet. */
		uint8_t type;  /**< Type of the packet. */
		uint8_t service_uuid[2];  /**< UUID of the service. */
		uint8_t frame_type;  /**< Type of the frame. */
	} __attribute__((packed));

	struct moko_acc_data_t
	{
		uint8_t ranging_data;  /**< Ranging data. */
		uint8_t advertising_interval; /**< Advertising interval. */
		uint8_t sensor_sampling_rate; /**< Sensor sampling rate. */
		uint8_t sensor_full_scale; /**< Sensor full scale. */
		uint8_t trigger_threshold;  /**< Trigger threshold. */
		uint8_t sensor_data[6]; /**< Sensor data. */
		uint8_t battery_voltage[2];  /**< Battery voltage. */
		uint8_t rfu; /**< Reserved for future use. */
		uint8_t mac_address[6];  /**< MAC address of the device. */
	} __attribute__((packed));

	struct moko_acc_packet_t
	{
		moko_acc_header_t header; /**< Header section of the beacon packet. */
		moko_acc_data_t data;  /**< Data section of the beacon packet. */
	} __attribute__((packed));

	// ElapsedTimeChecker average_samples((int)BLE_INCLINOMETER_AVG_TIME);
};

esp_err_t setup_beaconator();