import { defineStore } from 'pinia';
import { ref } from 'vue';
export const useUserStore = defineStore('user', () => {
    const token = ref(localStorage.getItem('user_token') || '');
    const userInfo = ref(JSON.parse(localStorage.getItem('user_info') || 'null'));
    function setToken(t) {
        token.value = t;
        localStorage.setItem('user_token', t);
    }
    function setUserInfo(info) {
        userInfo.value = info;
        localStorage.setItem('user_info', JSON.stringify(info));
    }
    function logout() {
        token.value = '';
        userInfo.value = null;
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
    }
    return { token, userInfo, setToken, setUserInfo, logout };
});
//# sourceMappingURL=user.js.map