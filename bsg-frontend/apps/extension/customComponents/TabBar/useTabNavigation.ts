import { useRouter } from "next/router";
import { TabName } from '@bsg/models/TabName';
import { useActiveTab } from './useActiveTab';

export const useTabNavigation = () => {
    const setActiveTab = useActiveTab((s) => s.setActiveTab);
    const router = useRouter();
    
    return (tabName: TabName) => {
        setActiveTab(tabName);
        router.push(`/${tabName}-page`);
    };
};