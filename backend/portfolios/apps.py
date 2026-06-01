from django.apps import AppConfig


class PortfoliosConfig(AppConfig):
    name = 'portfolios'

    def ready(self):
        import portfolios.signals

