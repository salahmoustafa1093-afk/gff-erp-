import { createSlice } from '@reduxjs/toolkit';
const storedBranch = localStorage.getItem('currentBranch');
const initialState = {
    currentBranch: storedBranch ? JSON.parse(storedBranch) : null,
    branchList: [],
    isLoading: false,
    error: null,
};
export const branchSlice = createSlice({
    name: 'branch',
    initialState,
    reducers: {
        setCurrentBranch: (state, action) => {
            state.currentBranch = action.payload;
            if (action.payload) {
                localStorage.setItem('currentBranch', JSON.stringify(action.payload));
            }
            else {
                localStorage.removeItem('currentBranch');
            }
        },
        setBranchList: (state, action) => {
            state.branchList = action.payload;
            // If no current branch is set, use the main branch or first active branch
            if (!state.currentBranch && action.payload.length > 0) {
                const mainBranch = action.payload.find((b) => b.isMain && b.isActive);
                const firstActive = action.payload.find((b) => b.isActive);
                const defaultBranch = mainBranch || firstActive || action.payload[0];
                state.currentBranch = defaultBranch;
                localStorage.setItem('currentBranch', JSON.stringify(defaultBranch));
            }
        },
        addBranch: (state, action) => {
            state.branchList.push(action.payload);
        },
        updateBranch: (state, action) => {
            const index = state.branchList.findIndex((b) => b.id === action.payload.id);
            if (index !== -1) {
                state.branchList[index] = action.payload;
                if (state.currentBranch?.id === action.payload.id) {
                    state.currentBranch = action.payload;
                    localStorage.setItem('currentBranch', JSON.stringify(action.payload));
                }
            }
        },
        removeBranch: (state, action) => {
            state.branchList = state.branchList.filter((b) => b.id !== action.payload);
            if (state.currentBranch?.id === action.payload) {
                const mainBranch = state.branchList.find((b) => b.isMain && b.isActive);
                const firstActive = state.branchList.find((b) => b.isActive);
                state.currentBranch = mainBranch || firstActive || state.branchList[0] || null;
                if (state.currentBranch) {
                    localStorage.setItem('currentBranch', JSON.stringify(state.currentBranch));
                }
                else {
                    localStorage.removeItem('currentBranch');
                }
            }
        },
        setBranchLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setBranchError: (state, action) => {
            state.error = action.payload;
        },
        clearBranchState: (state) => {
            state.currentBranch = null;
            state.branchList = [];
            state.error = null;
            localStorage.removeItem('currentBranch');
        },
    },
});
export const { setCurrentBranch, setBranchList, addBranch, updateBranch, removeBranch, setBranchLoading, setBranchError, clearBranchState, } = branchSlice.actions;
export default branchSlice.reducer;
