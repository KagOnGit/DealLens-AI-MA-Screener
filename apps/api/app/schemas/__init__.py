# Re-export available schemas to stable import paths.
# Each import is wrapped to avoid crashing if a file is absent.

def _try_import(module, names):
    try:
        m = __import__(f"app.schemas.{module}", fromlist=names)
        g = globals()
        for n in names:
            if hasattr(m, n):
                g[n] = getattr(m, n)
    except Exception:
        pass

_try_import("company", ["CompanyBase","CompanyCreate","CompanyUpdate","Company"])
_try_import("deal",    ["DealBase","DealCreate","DealUpdate","Deal"])
_try_import("user",    ["UserBase","UserCreate","UserUpdate","User","Token","TokenPayload"])
