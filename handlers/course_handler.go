package handlers

import (
	"net/http"

	"cloud-course-system/config"
	"cloud-course-system/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GET /api/courses
func GetCourses(c *gin.Context) {
	var courses []models.Course
	result := config.DB.Find(&courses)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, courses)
}

// POST /api/enroll
func EnrollCourse(c *gin.Context) {
	var req struct {
		CourseID uint `json:"courseId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "参数错误"})
		return
	}

	result := config.DB.Model(&models.Course{}).
		Where("id = ? AND selected < capacity", req.CourseID).
		Update("selected", gorm.Expr("selected + 1"))

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "系统繁忙"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusConflict, gin.H{"message": "手慢了，课程已满！"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "选课成功！", "courseId": req.CourseID})
}
