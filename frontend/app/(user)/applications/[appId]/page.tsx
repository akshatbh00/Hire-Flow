export default function ApplicationDetailPage({ params }: { params: { appId: string } }) {
  return (
    <div>
      <h1>Application {params.appId}</h1>
    </div>
  );
}
