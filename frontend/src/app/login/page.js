import AuthForm from "../../components/AuthForm";

export default function LoginPage() {
  return (
    <div className="py-2 sm:py-4 lg:py-8">
      <AuthForm mode="login" />
    </div>
  );
}
