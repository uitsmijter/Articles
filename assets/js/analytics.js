// Adapted from https://github.com/gohugoio/hugo/blob/master/tpl/tplimpl/embedded/templates/google_analytics.html

{{- define "__ga_js_set_doNotTrack" -}}{{/* This is also used in the async version. */}}
    {{- $pc := .Site.Config.Privacy.GoogleAnalytics -}}
    {{- if not $pc.RespectDoNotTrack -}}
        var doNotTrack = false;
    {{- else -}}
        var dnt = (navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack);
        var doNotTrack = (dnt == "1" || dnt == "yes");
    {{- end -}}
{{- end -}}

{{- $pc := .Site.Config.Privacy.GoogleAnalytics -}}
{{- if (and (not hugo.IsServer) (not $pc.Disable)) -}}
    {{ with .Site.Config.Services.GoogleAnalytics.ID -}}
        {{ if hasPrefix . "G-"}}
            {{ template "__ga_js_set_doNotTrack" $ }}

            if (!doNotTrack) {
                window.dataLayer = window.dataLayer || [];

                function gtag() {
                    dataLayer.push(arguments);
                }
                
                gtag('js', new Date());
                gtag('config', '{{ . }}', { 'anonymize_ip': {{- $pc.AnonymizeIP -}} });
            }

        {{ else if hasPrefix . "UA-" }}
            {{ template "__ga_js_set_doNotTrack" $ }}

            if (!doNotTrack) {
                (function(i, s, o, g, r, a, m) {
                    i['GoogleAnalyticsObject'] = r;
                    i[r] = i[r] || function() {
                        (i[r].q = i[r].q || []).push(arguments)
                    }, i[r].l = 1 * new Date();
                    a = s.createElement(o),
                        m = s.getElementsByTagName(o)[0];
                    a.async = 1;
                    a.src = g;
                    m.parentNode.insertBefore(a, m)
                })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
                
                {{- if $pc.UseSessionStorage }}
                    if (window.sessionStorage) {
                        var GA_SESSION_STORAGE_KEY = 'ga:clientId';
                        ga('create', '{{ . }}', {
                            'storage': 'none',
                            'clientId': sessionStorage.getItem(GA_SESSION_STORAGE_KEY)
                        });
                    
                        ga(function(tracker) {
                            sessionStorage.setItem(GA_SESSION_STORAGE_KEY, tracker.get('clientId'));
                        });
                    }
                {{ else }}
                    ga('create', '{{ . }}', 'auto');
                {{ end -}}
                {{ if $pc.AnonymizeIP }}
                    ga('set', 'anonymizeIp', true);
                {{ end }}
                
                ga('send', 'pageview');
            }
        {{- end }}
    {{ end -}}
{{- end }}
