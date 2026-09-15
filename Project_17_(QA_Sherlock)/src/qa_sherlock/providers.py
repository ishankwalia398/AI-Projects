import os


class ProviderError(RuntimeError):
    pass


class Router:
    def __init__(self, configs, client_factory=None):
        self.configs = configs
        self.events = []
        self.client_factory = client_factory

    def client(self, config):
        key = os.getenv(config["key_env"])
        if not key:
            raise ProviderError(f"Missing {config['key_env']}")
        if self.client_factory:
            return self.client_factory(config, key)
        from openai import OpenAI
        return OpenAI(base_url=config["base_url"], api_key=key, timeout=45, max_retries=1)

    def complete(self, messages):
        for config in self.configs:
            try:
                response = self.client(config).chat.completions.create(
                    model=config["model"], messages=messages, temperature=0.1, max_tokens=6000)
                text = response.choices[0].message.content
                if not text:
                    raise ProviderError("Empty completion")
                self.events.append({"model": config["model"], "status": "success"})
                return text
            except Exception as exc:
                # Never serialize provider exceptions: they can contain credentials or prompts.
                self.events.append({"model": config["model"], "status": "failed", "error_type": type(exc).__name__})
        raise ProviderError("All configured LLM providers failed; check credentials, catalog and endpoint")

    def models(self):
        return [{"model": c["model"], "available": c["model"] in
                 {m.id for m in self.client(c).models.list().data}} for c in self.configs]
