'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, Product } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await apiClient.getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">همه محصولات</h1>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-xl transition-shadow">
              {product.thumbnail && (
                <div className="mb-4 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/product/${product.id}/thumbnail`}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              {product.category && (
                <div className="mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {product.category.name}
                  </span>
                </div>
              )}
              <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{product.description}</p>
              <div className="flex justify-between items-center mb-4">
                <div>
                  {product.discountedPrice && product.discountedPrice < product.price ? (
                    <div>
                      <span className="text-lg text-gray-400 dark:text-gray-500 line-through mr-2">
                        ${product.price}
                      </span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ${product.discountedPrice}
                      </span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${product.price}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500 dark:text-gray-400">نرخ برد:</span>
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400 mr-1">
                    {product.winrate}%
                  </span>
                </div>
              </div>
              <div className="space-y-2 mb-4 text-sm">
                {product.trading_style && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">سبک:</span>
                    <span className="font-medium dark:text-gray-300">{product.trading_style}</span>
                  </div>
                )}
                {product.trading_session && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">جلسه:</span>
                    <span className="font-medium dark:text-gray-300">{product.trading_session}</span>
                  </div>
                )}
                {product.backtest_trades_count && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">تعداد معاملات بکتست:</span>
                    <span className="font-medium dark:text-gray-300">{product.backtest_trades_count}</span>
                  </div>
                )}
                {product.courses && product.courses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400">دوره‌ها:</span>
                    <span className="font-medium dark:text-gray-300">{product.courses.length} دوره</span>
                  </div>
                )}
              </div>
              {product.keywords && product.keywords.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {product.keywords.slice(0, 3).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                    {product.keywords.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                        +{product.keywords.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <Link href={`/products/${product.id}`}>
                <Button className="w-full">مشاهده جزئیات</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

