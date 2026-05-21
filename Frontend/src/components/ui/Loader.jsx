export default function Loader({ page = false, text = 'Loading...' }) {
  if (page) {
    return (
      <div className="loader-page">
        <div className="spinner" />
        <p>{text}</p>
      </div>
    )
  }
  return <div className="spinner spinner-sm" />
}
