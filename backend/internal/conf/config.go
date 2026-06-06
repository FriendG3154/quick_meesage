package conf

type ReleaseMode string

const (
	ReleaseModeProd ReleaseMode = "prod"
	ReleaseModeDev  ReleaseMode = "dev"
)

type Config struct {
	InventoryMonitorWarehouses []int64          `yaml:"inventory_monitor_warehouses"`
	Mode                       ReleaseMode      `yaml:"mode"`
	Port                       int              `yaml:"port"`
	UploadPath                 string           `yaml:"upload_path"`
	Amqp                       AmqpConfig       `yaml:"amqp"`
	Database                   DatabaseConfig   `yaml:"database"`
	Redis                      RedisConfig      `yaml:"redis"`
	Cloudflare                 CloudflareConfig `yaml:"cloudflare"`
	Dingtalk                   DingtalkConfig   `yaml:"dingtalk"`
	Wechat                     WechatConfig     `yaml:"wechat"`
	AliyunOss                  AliyunOssConfig  `yaml:"aliyun_oss"`
	Sms                        SmsConfig        `yaml:"sms"`
	Wdt                        WdtConfig        `yaml:"wdt"`
}
