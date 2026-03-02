-- Attach triggers to user-related tables for auditing
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_roles_trigger ON public.roles;
CREATE TRIGGER audit_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.roles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

DROP TRIGGER IF EXISTS audit_permissions_trigger ON public.permissions;
CREATE TRIGGER audit_permissions_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.permissions
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
