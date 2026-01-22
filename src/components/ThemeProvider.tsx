import { useTheme } from '../hooks/useTheme';
import ThemeToggle from './ThemeToggle';

const ThemeProvider = ({ children }) => {
  useTheme(); // This will initialize the theme and apply the class to the html element
  return (
    <>
      <ThemeToggle />
      {children}
    </>
  )
}

export default ThemeProvider;
