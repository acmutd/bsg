import { useRouter } from "next/router";
import { TabName } from '@bsg/models/TabName';
import { useRoomStore } from "@/stores/useRoomStore";
import { pushRoute } from '@/utils/navigation';

export const useTabNavigation = () => {
    const setActiveTab = useRoomStore(s => s.setActiveTab);
    const router = useRouter();
    
    return (tabName: TabName) => {
        setActiveTab(tabName);
        pushRoute(router, `/${tabName}-page`).catch(error => console.error('Failed to navigate tabs', error));
    };
};