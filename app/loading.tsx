export default function Loading() {
  return (
    <div className="mx-4 p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-500 rounded w-1/3"></div>
      <div className="h-4 bg-gray-500 rounded w-full"></div>
      <div className="h-4 bg-gray-500 rounded w-5/6"></div>
      <div className="h-4 bg-gray-500 rounded w-4/6"></div>
    </div>
  );
}
