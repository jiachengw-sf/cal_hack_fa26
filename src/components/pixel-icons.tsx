function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function BambooIcon({ className }: { className?: string }) {
  return (
    <div
      className={cx("border-2 border-panda-black", className)}
      style={{
        background:
          "linear-gradient(90deg, rgba(0,0,0,0.18) 0 3px, transparent 3px 30px, rgba(0,0,0,0.18) 30px 33px)," +
          "repeating-linear-gradient(0deg, var(--color-bamboo-700) 0 6px, var(--color-bamboo-500) 6px 18px)",
      }}
    />
  );
}

export function PandaIcon({ className }: { className?: string }) {
  return (
    <div className={cx("relative rounded-md bg-panda-cream", className)}>
      <span className="absolute -top-[5px] left-[-3px] h-[10px] w-[10px] rounded-[3px] bg-panda-black" />
      <span className="absolute -top-[5px] right-[-3px] h-[10px] w-[10px] rounded-[3px] bg-panda-black" />
      <span className="absolute left-[6px] top-[12px] h-[8px] w-[24px] rounded-[4px] bg-panda-black" />
      <span className="absolute left-[15px] top-[21px] h-[5px] w-[6px] rounded-[2px] bg-panda-black" />
    </div>
  );
}
