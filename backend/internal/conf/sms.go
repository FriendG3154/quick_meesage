package conf

type SmsConfig struct {
	SignName        string `yaml:"sign_name"`
	TemplateCode    string `yaml:"template_code"`
	AccessKeyID     string `yaml:"access_key_id"`
	AccessKeySecret string `yaml:"access_key_secret"`
	RegionId        string `yaml:"region_id"`
}
