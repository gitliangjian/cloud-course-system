package main

import (
	"fmt"

	"cloud-course-system/config"
	"cloud-course-system/router"
)

func main() {
	// 1. 初始化数据库
	config.InitDB()

	// 2. 初始化路由
	r := router.SetupRouter()

	// 3. 启动 HTTP 服务
	fmt.Println("服务启动在 :8080 端口...")
	r.Run(":8080")
}
