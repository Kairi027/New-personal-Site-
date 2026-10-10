import streamlit as st
from _datetime import datetime
import os
import json
from openai import OpenAI
st.set_page_config(
    page_title="AI Partner",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="auto",
    menu_items={}
)

def generate_session_name():
    return datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

def save_session():
    # 保存当前会话信息
    if st.session_state.current_session:
        session_data = {
            "nickname": st.session_state.nickname,
            "nature": st.session_state.nature,
            "current_session": st.session_state.current_session,
            "messages": st.session_state.messages
        }

        # 如果 session data目录不存在，则创建
        if not os.path.exists("./project/session data"):
            os.makedirs("./project/session data")
        with open(f"./project/session data/{st.session_state.current_session}.json", "w", encoding="utf-8") as f:
            json.dump(session_data, f, ensure_ascii=False, indent=4)

# 加载所有会话信息
def load_sessions():
    session_list = []

    # 如果 session data 目录存在，则加载所有会话信息
    if os.path.exists("./project/session data"):
        file_list = os.listdir("./project/session data")
        for file_name in file_list:
            if file_name.endswith(".json"):
                session_list.append(file_name[:-5])

    return sorted(session_list,reverse=True)

# 加载指定会话
def load_session(session_name):
    try:
        if os.path.exists(f"./project/session data/{session_name}.json"):
            with open(f"./project/session data/{session_name}.json", "r", encoding="utf-8") as f:
                session_data = json.load(f)
                st.session_state.nickname = session_data["nickname"]
                st.session_state.nature = session_data["nature"]
                st.session_state.current_session = session_data["current_session"]
                st.session_state.messages = session_data["messages"]

    except Exception as e:
        st.error(f"Error loading session {session_name}: {e}")

# 删除指定会话
def delete_session(session_name):
    try:
        if os.path.exists(f"./project/session data/{session_name}.json"):
            os.remove(f"./project/session data/{session_name}.json")
            # 如果删除的是当前会话，则需更新消息列表
            if session_name == st.session_state.current_session:
                st.session_state.messages = []
                st.session_state.current_session = generate_session_name()
    except Exception as e:
        st.error(f"Error deleting session {session_name}: {e}")
# 大标题
st.title("AI Partner")
st.header("欢迎使用AI Partner")

# logo
st.logo("./project/resources/AI Partner LOGO.png", size="large")



# 初始化聊天信息
if "messages" not in st.session_state:
    st.session_state.messages = []

if "nickname" not in st.session_state:
    st.session_state.nickname = "大肥鱼"

if "nature" not in st.session_state:
    st.session_state.nature = "呆萌中二的助手"

# 会话标识
if "current_session" not in st.session_state:
    st.session_state.current_session = generate_session_name() #现在时间

# 提示
if "notice" not in st.session_state:
    st.session_state.notice = None

# 显示提示
if st.session_state.notice:
    st.toast(st.session_state.notice, duration=1)
    st.session_state.notice = None



# 展示历史聊天信息
st.text(f"会话名称：{st.session_state.current_session}")
for message in st.session_state.messages:
    if message["role"] == "user":
        left,right = st.columns([6,4])
        with left:
            st.chat_message(
                "user",
                avatar="./project/resources/user.webp"
            ).write(message["content"])

    elif message["role"] == "assistant":
        left,right = st.columns([4,6])
        with right:
            st.chat_message(
                "assistant"
            ).write(message["content"])

# 创建一个AI客户端
client = OpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"),base_url="https://api.deepseek.com")


# 左侧侧边栏
with st.sidebar: # with 上下文管理器，固定

    # 会话信息
    st.subheader("AI 控制面板")

    # 新建会话按钮
    if st.button("新建会话", icon="✏️", width="stretch"):

        # 保存当前会话信息
        save_session()

        # 创建一个新会话(如果当前会话有聊天信息)
        if st.session_state.messages:
            st.session_state.messages = []
            st.session_state.current_session = generate_session_name()
            save_session()
            st.session_state.notice="🟢 Created successfully"
            st.rerun()  # 重新运行页面


    # 会话选择
    st.text("历史会话")
    session_list = load_sessions()
    for session in session_list:
        col1,col2 = st.columns([4,1])
        with col1:
            # 加载会话信息
            if st.button(session, icon="🗂️",type="primary" if session == st.session_state.current_session else "secondary",width="stretch",key=f"load{session}"):
                load_session(session)
                st.session_state.notice ="🟢 Loaded successfully"
                st.rerun()


        with col2:
            # 删除会话信息
            if st.button("", icon="❌️",width="stretch",key=f"delete{session}"):
                delete_session(session)
                st.session_state.notice="🟢 Deleted successfully"
                st.rerun()



    st.divider()
    # 角色信息
    st.subheader("Partner Information")
    nickname = st.text_input("Partner Nickname",placeholder="请输入昵称",value=st.session_state.nickname)
    if nickname:
        st.session_state.nickname = nickname
    nature = st.text_input("Partner nature",placeholder="请输入性格",value=st.session_state.nature)
    if nature:
        st.session_state.nature = nature




# 聊天消息输入框
prompt = st.chat_input("Please input your question")
if prompt:
    left,right = st.columns([6,4])
    with left:
        st.chat_message("user",avatar="./project/resources/user.webp").write(prompt)
    print(f"----------用户->大模型----------\n{prompt}")
    st.session_state.messages.append({"role": "user", "content": prompt})

    # 系统提示词
    system_prompt = f"你的名字是{st.session_state.nickname}，你的性格：{st.session_state.nature}"

    # 调用AI大模型
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role":"system","content":system_prompt},
            *st.session_state.messages # 列表解包
        ],

        stream=True # 流式输出
    )
    left,right = st.columns([4,6])
    with right:
        # 非流式输出的结果
        # answer = response.choices[0].message.content
        # st.chat_message("assistant").write(answer)

        # 流式输出的结果
        # 1. 先用 with 创建一个固定的“助理”聊天气泡容器
        with st.chat_message("assistant"):
            # 2. 在这个气泡内部创建一个动态更新的空槽位
            response_message = st.empty()
            answer = ''

            # 3. 开始循环获取大模型吐出的文本
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content is not None:
                    answer += chunk.choices[0].delta.content
                    # 4. 在同一个槽位里不断刷新文字，实现打字机效果
                    response_message.write(answer)

    # 循环结束后，打印并持久化到会话中
    print(f"----------大模型->用户----------\n{answer}")

    # 保存大模型消息列表
    st.session_state.messages.append({"role": "assistant", "content": answer})

    # 保存会话信息
    save_session()