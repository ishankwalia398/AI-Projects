import pytest

from app import live_research, rendering


def test_grounding_without_key_is_explicit(monkeypatch):
    monkeypatch.setattr(live_research.settings,'llm_key','')
    assert live_research.research({},'visa')['available'] is False


def test_latex_dependency_error_is_actionable(monkeypatch):
    monkeypatch.setenv('DOCUMENT_RENDERER','latex')
    monkeypatch.setattr(rendering,'converter',lambda name:None)
    with pytest.raises(ValueError,match='Pandoc'):
        rendering.render({'sections':[]},'docx')


@pytest.mark.parametrize('format',['pdf','docx'])
def test_binary_converters_use_exact_tex_source(monkeypatch,format):
    monkeypatch.setenv('DOCUMENT_RENDERER','latex')
    monkeypatch.setattr(rendering.shutil,'which',lambda name:name)
    data={'title':'Example & 100%','sections':[{'heading':'Q1','text':'Answer: safe \\input{secret}'}]}
    expected=rendering.render(data,'tex')
    def run(args,**kwargs):
        root=kwargs['cwd']
        assert (root/'document.tex').read_bytes()==expected
        if format=='pdf': assert '-no-shell-escape' in args
        (root/('document.'+format)).write_bytes(b'converted')
    monkeypatch.setattr(rendering.subprocess,'run',run)
    assert rendering.render(data,format)==b'converted'
