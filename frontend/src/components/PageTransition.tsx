import { motion } from 'framer-motion';

const variants = {
  initial: { opacity: 0, y: 18, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.99,
    transition: { duration: 0.22 },
  },
};

interface Props {
  children: React.ReactNode;
}

export default function PageTransition({ children }: Props) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}
