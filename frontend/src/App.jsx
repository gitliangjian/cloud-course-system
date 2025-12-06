import React, { useState, useEffect } from 'react';
import { Layout, Button, Progress, message, Spin, Typography } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import axios from 'axios';
import './App.css';

const { Header, Content } = Layout;
const { Text } = Typography;

// localStorage 的 key
const ENROLLED_COURSES_KEY = 'enrolled_courses';

function App() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrollingIds, setEnrollingIds] = useState(new Set());
  const [enrolledCourses, setEnrolledCourses] = useState(new Set());
  const [expandedIds, setExpandedIds] = useState(new Set());

  // 从 localStorage 读取已选课程
  const loadEnrolledCourses = () => {
    try {
      const stored = localStorage.getItem(ENROLLED_COURSES_KEY);
      if (stored) {
        const courseIds = JSON.parse(stored);
        setEnrolledCourses(new Set(courseIds));
      }
    } catch (error) {
      console.error('Error loading enrolled courses from localStorage:', error);
      setEnrolledCourses(new Set());
    }
  };

  // 保存已选课程到 localStorage
  const saveEnrolledCourse = (courseId) => {
    try {
      const stored = localStorage.getItem(ENROLLED_COURSES_KEY);
      let courseIds = stored ? JSON.parse(stored) : [];
      
      if (!courseIds.includes(courseId)) {
        courseIds.push(courseId);
        localStorage.setItem(ENROLLED_COURSES_KEY, JSON.stringify(courseIds));
        setEnrolledCourses(new Set(courseIds));
      }
    } catch (error) {
      console.error('Error saving enrolled course to localStorage:', error);
    }
  };

  // 获取课程列表
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/courses');
      setCourses(response.data);
    } catch (error) {
      message.error('获取课程列表失败，请稍后重试');
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取课程列表和已选课程记录
  useEffect(() => {
    loadEnrolledCourses();
    fetchCourses();
  }, []);

  // 处理抢课
  const handleEnroll = async (courseId, e) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发展开/收起

    if (enrollingIds.has(courseId)) {
      return;
    }

    if (enrolledCourses.has(courseId)) {
      message.warning('您已经选过这门课了');
      return;
    }

    setEnrollingIds(prev => new Set(prev).add(courseId));

    try {
      await axios.post('http://localhost:8080/api/enroll', {
        courseId: courseId
      });
      message.success('选课成功');
      
      saveEnrolledCourse(courseId);
      await fetchCourses();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error || 
                       '选课失败，请重试';
      message.error(errorMsg);
      console.error('Error enrolling course:', error);
    } finally {
      setEnrollingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    }
  };

  // 切换展开/收起状态
  const toggleExpand = (courseId) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  // 计算进度百分比
  const calculateProgress = (selected, capacity) => {
    if (capacity === 0) return 100;
    return Math.round((selected / capacity) * 100);
  };

  // 判断课程是否已满
  const isFull = (selected, capacity) => {
    return selected >= capacity;
  };

  // 判断是否已选该课程
  const isEnrolled = (courseId) => {
    return enrolledCourses.has(courseId);
  };

  // 获取按钮文字
  const getButtonText = (course) => {
    if (isFull(course.selected, course.capacity)) {
      return '已满';
    }
    if (isEnrolled(course.id)) {
      return '已选';
    }
    return '立即选课';
  };

  // 判断按钮是否应该禁用
  const isButtonDisabled = (course) => {
    return isFull(course.selected, course.capacity) || isEnrolled(course.id);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#1890ff', 
        color: 'white', 
        fontSize: '24px', 
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '0 50px'
      }}>
        云端选课系统
      </Header>
      
      <Content style={{ 
        padding: '50px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" tip="加载中...">
              <div style={{ minHeight: '200px' }} />
            </Spin>
          </div>
        ) : (
          <div className="course-list">
            {courses.map((course) => {
              const progress = calculateProgress(course.selected, course.capacity);
              const courseFull = isFull(course.selected, course.capacity);
              const courseEnrolled = isEnrolled(course.id);
              const isEnrolling = enrollingIds.has(course.id);
              const buttonDisabled = isButtonDisabled(course);
              const buttonText = getButtonText(course);
              const isExpanded = expandedIds.has(course.id);

              return (
                <div
                  key={course.id}
                  className="course-item"
                  style={{
                    marginBottom: '12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                  }}
                >
                  {/* 主要内容区域 */}
                  <div
                    onClick={() => toggleExpand(course.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '20px 24px',
                      background: isExpanded ? '#f5f5f5' : '#fff',
                      transition: 'background 0.3s',
                    }}
                  >
                    {/* 课程名称 - 最左 */}
                    <div style={{ 
                      flex: '0 0 250px',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: '#262626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {course.name}
                      {isExpanded ? <UpOutlined style={{ fontSize: '12px' }} /> : <DownOutlined style={{ fontSize: '12px' }} />}
                    </div>

                    {/* 进度条和名额信息 - 中间靠右 */}
                    <div style={{ 
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      paddingLeft: '40px',
                      paddingRight: '40px'
                    }}>
                      <div style={{ flex: 1, maxWidth: '400px' }}>
                        <Progress
                          percent={progress}
                          status={progress >= 100 ? 'exception' : 'active'}
                          strokeColor={progress >= 100 ? '#ff4d4f' : '#1890ff'}
                          showInfo={false}
                        />
                      </div>
                      <div style={{ 
                        minWidth: '150px',
                        textAlign: 'right',
                        color: courseFull ? '#ff4d4f' : '#52c41a',
                        fontWeight: '500'
                      }}>
                        <Text style={{ color: 'inherit' }}>
                          剩余 {Math.max(0, course.capacity - course.selected)} / 总量 {course.capacity}
                        </Text>
                      </div>
                    </div>

                    {/* 按钮 - 最右 */}
                    <div style={{ flex: '0 0 120px', textAlign: 'right' }}>
                      <Button
                        type={courseEnrolled ? 'default' : 'primary'}
                        danger={courseFull}
                        disabled={buttonDisabled || isEnrolling}
                        loading={isEnrolling}
                        onClick={(e) => handleEnroll(course.id, e)}
                        style={{ width: '100px' }}
                      >
                        {buttonText}
                      </Button>
                    </div>
                  </div>

                  {/* 展开的描述区域 */}
                  {isExpanded && (
                    <div
                      className="course-description"
                      style={{
                        padding: '20px 24px',
                        background: '#fafafa',
                        borderTop: '1px solid #e8e8e8',
                      }}
                    >
                      <div style={{ 
                        color: '#595959',
                        lineHeight: '1.6',
                        fontSize: '14px'
                      }}>
                        <strong>课程描述：</strong>
                        <br />
                        {course.description}
                      </div>
                      {courseEnrolled && !courseFull && (
                        <div style={{
                          marginTop: '12px',
                          padding: '8px 12px',
                          background: '#f6ffed',
                          border: '1px solid #b7eb8f',
                          borderRadius: '4px',
                          color: '#52c41a',
                          fontSize: '13px'
                        }}>
                          ✓ 您已成功选择该课程
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 0',
            color: '#999',
            fontSize: '16px'
          }}>
            暂无课程数据
          </div>
        )}
      </Content>
    </Layout>
  );
}

export default App;
