import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CartNotification from './CartNotification';
import { useCartNotificationContext } from '@/context/CartNotificationContext';
import { ZoneInfo } from '@/config/zones';
import { CatalogBrand, CatalogCategory, CatalogVariant } from '@/hooks/useZoneCatalog';

interface MainLayoutProps {
  children: ReactNode;
  onSelectBrand?: (brandId: string) => void;
  zoneName?: string;
  zoneInfo?: ZoneInfo;
  brands?: CatalogBrand[];
  categories?: CatalogCategory[];
  variants?: CatalogVariant[];
}

const MainLayout = ({ children, onSelectBrand, zoneInfo, brands, categories, variants }: MainLayoutProps) => {
  const { notification, hideNotification } = useCartNotificationContext();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onSelectBrand={onSelectBrand} brands={brands} categories={categories} variants={variants} />
      <main className="flex-1 pt-16 md:pt-20">
        {children}
      </main>
      <Footer zoneInfo={zoneInfo} />
      <CartNotification 
        productName={notification.productName}
        isVisible={notification.visible}
        onHide={hideNotification}
      />
    </div>
  );
};

export default MainLayout;
