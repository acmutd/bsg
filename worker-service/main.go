package main

import (
	"fmt"

	"github.com/acmutd/bsg/worker-service/lib"
)

func main() {
	leetcode, err := lib.NewLeetcode("bsgvippro123", "bsgisdabest123");
	if err != nil {
		fmt.Println("Fail")
	}
	fmt.Println(leetcode)
	fmt.Println()
	lib.SubmitSolution("python", "")
}