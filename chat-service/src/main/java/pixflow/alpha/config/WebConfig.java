package pixflow.alpha.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pixflow.alpha.filter.JwtTokenFilter;

@Configuration
public class WebConfig {

    private final JwtTokenFilter jwtTokenFilter;

    public WebConfig(JwtTokenFilter jwtTokenFilter) {
        this.jwtTokenFilter = jwtTokenFilter;
    }

    @Bean
    public FilterRegistrationBean<JwtTokenFilter> jwtFilter() {
        FilterRegistrationBean<JwtTokenFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(jwtTokenFilter);
        registrationBean.addUrlPatterns("/conversations/*", "/messages/*"); // Apply filter to chat endpoints
        return registrationBean;
    }
}