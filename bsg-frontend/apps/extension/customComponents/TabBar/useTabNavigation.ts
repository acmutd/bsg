import { useRouter } from "next/router";
import { TabName } from '@bsg/models/TabName';
import { useRoomStore } from "@/stores/useRoomStore";

export const useTabNavigation = () => {
    const setActiveTab = useRoomStore(s => s.setActiveTab);
    const router = useRouter();
    
    return (tabName: TabName) => {
        setActiveTab(tabName);
        router.push(`/${tabName}-page`);
    };
};