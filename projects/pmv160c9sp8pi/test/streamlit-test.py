import streamlit as st

# 设置页面配置项
st.set_page_config(
    page_title="Ex-stream-ly Cool App",
    page_icon="🧊",

    # 网页布局
    layout="centered",

    # 控制侧边栏的状态
    initial_sidebar_state="expanded",
    menu_items={
        'Get Help': 'https://www.itcast.cn',
        'Report a bug': "https://www.baidu.com",
        'About': "# This is a header. This is an *extremely* cool app!"
    }
)

# 标题
st.title("大标题")
st.header("1级标题")
st.subheader("2级标题")

# 段落文字
st.write("段落文字1：xxxxxxxxxxxxxxxxxxxxxxxxxx")
st.write("段落文字2：xxxxxxxxxxxxxxxxxxxxxxxxxx")
st.write("段落文字3：xxxxxxxxxxxxxxxxxxxxxxxxxx")

# 图片
st.image("../resources/car.jpg")

# 音频
st.audio("../resources/stage4.mp3")

# 视频
st.video("../resources/testvideo.mp4")

# logo
st.logo("../resources/car.jpg")

# 表格
student_data ={
    "学生":["王",'张','马','留','gao'],
    "数学":[100,99,97,98,88],
    "语文":[102,99,97,98,78],
    "英语":[98,89,58,29,90],
}
st.table(student_data)

# 输入框
name = st.text_input("please input your name")
st.write(f"你的姓名是{name}")

password = st.text_input("please input your password",type="password")
st.write(f"你的密码是{password}")



# 单选按钮
gender=st.radio("请输入你的性别",["m","f","no"])
st.write(f"your gender is {gender}")
