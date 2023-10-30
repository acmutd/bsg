package lib

import (
	"github.com/acmutd/bsg/worker-service/utils"
)

var Uris_US utils.Uris = utils.Uris {
	Base:        "https://leetcode.com/",
	Login:       "https://leetcode.com/accounts/login/",
	Graphql:     "https://leetcode.com/graphql",
	ProblemsAll: "https://leetcode.com/api/problems/all/",
	Problem:     "https://leetcode.com/problems/$slug",
	Submit:      "https://leetcode.com/problems/$slug/submit/",
	Submission:  "https://leetcode.com/submissions/detail/$id/",
}

var CSRF_Token string
var LEETCODE_SESSION string
