package conf

// AmqpConfig holds RabbitMQ connection settings.
type AmqpConfig struct {
	Url string `yaml:"url"`
}
