package conf

type WdtConfig struct {
	Sid       string `yaml:"sid"`
	AppKey    string `yaml:"app_key"`
	AppSecret string `yaml:"app_secret"`
	Salt      string `yaml:"salt"`
	ApiURL    string `yaml:"api_url"`
}
