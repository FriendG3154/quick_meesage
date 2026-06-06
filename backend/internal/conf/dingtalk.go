package conf

type DingtalkConfig struct {
	AppKey              string `yaml:"app_key"`
	AppSecret           string `yaml:"app_secret"`
	CorpId              string `yaml:"corp_id"`
	AgentId             string `yaml:"agent_id"`
	RobotXXSGWebhookURL string `yaml:"robot_xxsg_webhook_url"`
	RobotXXSGSecret     string `yaml:"robot_xxsg_secret"`
	RobotXXSHWebhookURL string `yaml:"robot_xxsh_webhook_url"`
	RobotXXSHSecret     string `yaml:"robot_xxsh_secret"`
}
