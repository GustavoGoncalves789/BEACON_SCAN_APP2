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

Decode da payload (beacon m2 ou m3):


	struct moko_acc_header_t
	{
		uint8_t flags[3];  /< Flags for indicating packet information. */
		uint8_t tx_power_level[3]; /< Transmit power level. */
		uint8_t length;   /< Length of the packet. */
		uint8_t type;  /< Type of the packet. */
		uint8_t service_uuid[2];  /< UUID of the service. */
		uint8_t frame_type;  /< Type of the frame. */
	} _attribute_((packed));

	struct moko_acc_data_t
	{
		uint8_t ranging_data;  /< Ranging data. */
		uint8_t advertising_interval; /< Advertising interval. */
		uint8_t sensor_sampling_rate; /< Sensor sampling rate. */
		uint8_t sensor_full_scale; /< Sensor full scale. */
		uint8_t trigger_threshold;  /< Trigger threshold. */
		uint8_t sensor_data[6]; /< Sensor data. */
		uint8_t battery_voltage[2];  /< Battery voltage. */
		uint8_t rfu; /< Reserved for future use. */
		uint8_t mac_address[6];  /< MAC address of the device. */
	} _attribute_((packed));

	struct moko_acc_packet_t
	{
		moko_acc_header_t header; /< Header section of the beacon packet. */
		moko_acc_data_t data;  /< Data section of the beacon packet. */
	} _attribute_((packed));