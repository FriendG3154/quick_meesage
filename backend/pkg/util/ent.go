package util

import (
	"errors"
	"regexp"
	"unicode/utf8"
)

var PhoneNoRegexp = regexp.MustCompile("^1[0-9]{10}$")

// MaxRuneCount validates the rune length of a string by using the unicode/utf8 package.
func MaxRuneCount(maxLen int) func(s string) error {
	return func(s string) error {
		if utf8.RuneCountInString(s) > maxLen {
			return errors.New("value is more than the max length")
		}
		return nil
	}
}
