/**
 * The pricing block, shared by the Landing page and the film (scene S10). The free offer is the headline above it;
 * this is what comes after, said plainly: what Plus is for, the two plans side by side with the free trial first
 * and the price after it, one short list of what you get, and the promise that everything made stays yours.
 * Every figure and word comes from site.ts (prices from content/pricing.ts). Server-rendered and static, so it
 * reads the same with no JavaScript and with reduced motion.
 */
import { site } from '@/content/site';
import styles from './PricingPlans.module.css';

const copy = site.scenes.s10;

export function PricingPlans() {
  const { plus } = copy;
  return (
    <div className={styles.wrap}>
      <p className={styles.lede}>{copy.lede}</p>
      <ul className={styles.plans} aria-label={copy.support}>
        {plus.plans.map((plan) => (
          <li key={plan.name} className={`${styles.plan} ${plan.note ? styles.better : ''}`}>
            <span className={styles.planName}>
              {plus.name} {plan.name.toLowerCase()}
            </span>
            <span className={styles.trial}>{plan.trial}</span>
            <span className={styles.cost}>
              <span className={styles.then}>{plan.then}</span>
              <span className={styles.price}>{plan.price}</span>
              <span className={styles.per}>{plan.per}</span>
            </span>
            {plan.note ? <span className={styles.note}>{plan.note}</span> : null}
          </li>
        ))}
      </ul>
      <ul className={styles.includes}>
        {plus.includes.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className={styles.promise}>{copy.promise}</p>
    </div>
  );
}
