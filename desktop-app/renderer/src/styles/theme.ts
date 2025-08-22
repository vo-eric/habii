import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#e8f4fd',
      100: '#bee1f9',
      200: '#94cef5',
      300: '#6abbf1',
      400: '#40a8ed',
      500: '#1695e9',
      600: '#127abd',
      700: '#0e5e91',
      800: '#0a4265',
      900: '#062639',
    },
  },
  fonts: {
    heading: `'Geist', -apple-system, BlinkMacSystemFont, sans-serif`,
    body: `'Geist', -apple-system, BlinkMacSystemFont, sans-serif`,
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: {
          borderRadius: 'md',
          fontWeight: 'medium',
        },
        outline: {
          borderRadius: 'md',
          fontWeight: 'medium',
        },
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.500',
      },
      variants: {
        outline: {
          field: {
            borderRadius: 'md',
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            },
          },
        },
      },
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme;
