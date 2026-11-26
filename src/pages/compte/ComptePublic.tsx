import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Bell, CreditCard, FileText, Gavel, History, Mail, Eye, EyeOff } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { accountRegistrationSchema } from "@/lib/account-registration";

const benefits = [
  { icon: History, title: "Achats et bordereaux", text: "Retrouvez l’historique de vos achats et les bordereaux associés." },
  { icon: Bell, title: "Alertes personnalisées", text: "Rassemblez vos mots-clés et vos centres d’intérêt." },
  { icon: Gavel, title: "Ordres d’achat", text: "Retrouvez vos ordres et vos demandes d’enchères par téléphone." },
  { icon: CreditCard, title: "Paiement en ligne", text: "Accédez au suivi et au règlement de vos achats." },
  { icon: FileText, title: "Vos documents", text: "Centralisez les informations et documents de votre compte." },
];

export default function ComptePublic() {
  const { signUp } = useAuth();
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const [terms, setTerms] = useState(false);
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const parsed = accountRegistrationSchema.safeParse({ ...values, terms });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Vérifiez vos informations."); return; }
    setSubmitting(true);
    try {
      const data = parsed.data;
      const result = await signUp(data.email, data.password, {
        firstName: data.firstName, lastName: data.lastName, displayName: `${data.firstName} ${data.lastName}`,
      });
      if (result.error) {
        setError(result.error.message.includes("already") ? "Cette adresse possède déjà un compte. Connectez-vous ci-dessous." : "La création du compte n’a pas abouti. Réessayez dans quelques instants.");
        return;
      }
      setValues((current) => ({ ...current, password: "", confirmPassword: "" }));
      setSent(true);
    } catch {
      setError("La connexion a été interrompue. Réessayez dans quelques instants.");
    } finally { setSubmitting(false); }
  };

  return <div className="min-h-screen bg-background">
    <Helmet><title>Votre compte client | Le Marteau Digital</title><meta name="description" content="Votre compte client : achats, bordereaux, alertes, ordres d’achat et documents." /></Helmet>
    <Header />
    <main className="container pb-16" style={{ paddingTop: "calc(var(--header-height, var(--header-main-height, 145px)) + 2rem)" }}>
      <h1 className="font-serif text-3xl md:text-4xl text-center mb-10">Votre compte client</h1>
      <section aria-label="Les avantages de votre compte" className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 border-y border-border py-8 mb-12">
        {benefits.map(({ icon: Icon, title, text }) => <div key={title}>
          <Icon className="w-6 h-6 text-brand-gold mb-3" aria-hidden="true" />
          <h2 className="font-medium text-base mb-2">{title}</h2><p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
        </div>)}
      </section>
      <section className="max-w-lg mx-auto" aria-labelledby="account-signup-title">
        <h2 id="account-signup-title" className="font-serif text-2xl mb-6">Créer mon compte</h2>
        {sent ? <div role="status" className="border border-border p-6 rounded-md">
          <Mail className="text-brand-gold w-7 h-7 mb-4" /><h3 className="font-medium mb-2">Vérifiez votre boîte e-mail</h3>
          <p className="text-sm text-muted-foreground">Si votre adresse permet une inscription, vous recevrez un message de confirmation : cliquez sur son lien pour activer votre compte.</p>
        </div> : <form onSubmit={submit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">{([['firstName', 'Prénom'], ['lastName', 'Nom']] as const).map(([name, label]) => <div key={name} className="space-y-2">
            <Label htmlFor={`account-${name}`}>{label}</Label><Input id={`account-${name}`} name={name} autoComplete={name === 'firstName' ? 'given-name' : 'family-name'} required value={values[name]} onChange={(event) => setValues({ ...values, [name]: event.target.value })} />
          </div>)}</div>
          <div className="space-y-2"><Label htmlFor="account-email">Adresse e-mail</Label><Input id="account-email" name="email" type="email" autoComplete="email" required value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} /></div>
          <div className="space-y-2"><Label htmlFor="account-password">Mot de passe</Label><div className="relative">
            <Input id="account-password" name="password" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={8} className="pr-12" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} />
            <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} title={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
          </div><p className="text-xs text-muted-foreground">8 caractères minimum, avec une majuscule, un chiffre et un caractère spécial.</p></div>
          <div className="space-y-2"><Label htmlFor="account-confirm">Confirmer le mot de passe</Label><Input id="account-confirm" name="confirmPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" required value={values.confirmPassword} onChange={(event) => setValues({ ...values, confirmPassword: event.target.value })} /></div>
          <div className="flex items-start gap-3"><Checkbox id="account-terms" checked={terms} onCheckedChange={(checked) => setTerms(checked === true)} /><Label htmlFor="account-terms" className="text-sm font-normal leading-relaxed">J’accepte les <Link to="/cgv" className="underline" target="_blank">conditions d’utilisation</Link> et j’ai lu la <Link to="/politique-confidentialite" className="underline" target="_blank">politique de confidentialité</Link>.</Label></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Création en cours…' : 'Créer mon compte'}</Button>
        </form>}
        <div className="border-t border-border mt-8 pt-6 text-center"><p className="text-muted-foreground mb-3">Déjà client ?</p><Button asChild variant="outline"><Link to="/auth">Se connecter</Link></Button></div>
      </section>
    </main><Footer />
  </div>;
}