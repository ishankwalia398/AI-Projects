class JiraQACrewError(Exception):
    """Base application error."""


class ConfigurationError(JiraQACrewError): pass
class JiraProviderError(JiraQACrewError): pass
class JiraAuthenticationError(JiraProviderError): pass
class JiraNotFoundError(JiraProviderError): pass
class JiraRateLimitError(JiraProviderError): pass
class JiraGatewayError(JiraProviderError): pass
class PipelineValidationError(JiraQACrewError): pass
class LLMProvidersExhaustedError(JiraQACrewError): pass
