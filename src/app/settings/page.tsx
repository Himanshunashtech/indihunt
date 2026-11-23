import { permanentRedirect } from "next/navigation";

export default function SettingsRedirectPage() {
  permanentRedirect("/profile/settings");
}
