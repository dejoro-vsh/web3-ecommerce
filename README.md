# Web3 E-Commerce Prototype (YACOMMERCE) - Knowledge Base & Playbook

เอกสารนี้รวบรวมสถาปัตยกรรม โฟลว์การทำงาน ปัญหาที่พบ และวิธีแก้ปัญหาของโปรเจกต์ Web3 E-Commerce เพื่อเป็น "คู่มือ (Playbook)" สำหรับการสร้างเว็บใหม่ในอนาคตได้อย่างรวดเร็ว

## 1. สถาปัตยกรรมระบบ (System Architecture)
โปรเจกต์นี้ถูกออกแบบมาแบบ **Cloud-First** เพื่อให้ทำงานได้โดยไม่ต้องพึ่งพาเซิร์ฟเวอร์แบบดั้งเดิม:
*   **Frontend:** React (Vite) ใช้ดีไซน์แบบ Glassmorphism (CSS ล้วน ไม่พึ่ง Tailwind เพื่อลดความซับซ้อน)
*   **Database:** Vercel Postgres (Serverless SQL) ใช้เก็บข้อมูลสินค้า (Products) และออเดอร์ (Orders)
*   **Backend API:** Vercel Serverless Functions (`/api/products.js`, `/api/orders.js`) ทำหน้าที่เชื่อม Frontend กับ Database
*   **Blockchain & Payments:** Polygon Mainnet
    *   ใช้ `ethers.js` (v6) ในการเชื่อมต่อ MetaMask กับหน้าเว็บ
    *   **Smart Contracts:** `MockUSDC` (เหรียญจำลอง) และ `PaymentProcessor` (รับชำระเงิน)
*   **Deployment:** Vercel (เว็บ) และ GitHub Actions (Smart Contracts)

## 2. ขั้นตอนการพัฒนาระบบที่สำคัญ (Workflow)
1. **ออกแบบ UI/UX:** ทำหน้าเว็บเป็น Responsive ให้รองรับมือถือก่อนเป็นอันดับแรก
2. **สร้าง Database:** ใช้ Vercel Postgres รันคำสั่ง SQL สร้างตาราง `products` และ `orders`
3. **ทำระบบ Admin:** สร้างระบบล็อกอินแบบง่ายด้วยรหัสผ่าน (Hardcoded password) และระบบเพิ่ม/แก้ไข/ลบ สินค้า พร้อมสวิตช์ Online/Offline (`is_active`)
4. **เตรียม Smart Contract:** เขียนโค้ด Solidity และเทสต์การทำงาน
5. **Deploy ผ่าน Cloud (ไร้ Node.js โลคัล):** ใช้ GitHub Actions รันสคริปต์ Hardhat เพื่อนำโค้ดขึ้นเชน โดยใช้ Private Key ซ่อนใน GitHub Secrets
6. **เชื่อมต่อ Web3:** ใช้ท่า "Approve" (อนุญาตให้ดึงเงิน) แล้วตามด้วย "Pay" (ดึงเงินเข้ากระเป๋าแม่ค้า)
7. **บันทึก Order:** เมื่อจ่ายเงินผ่านเชนสำเร็จ ถึงจะยิง API บันทึกข้อมูลที่อยู่ลูกค้าลง Database

## 3. สรุปปัญหาที่พบ (Challenges) และ วิธีแก้ไข (Solutions)

### ปัญหาที่ 1: Vercel Postgres แจ้ง Error "cannot insert multiple commands into a prepared statement"
*   **สาเหตุ:** โค้ด SQL เดิมดึงมาจาก Supabase ซึ่งมีการตั้งค่า RLS (Row Level Security) และ Trigger ที่ Vercel Postgres ไม่รองรับในคำสั่งเดียว
*   **วิธีแก้:** ตัดโค้ด RLS และ Trigger ออกทั้งหมด ใช้แค่คำสั่ง `CREATE TABLE` และ `INSERT` แบบเบสิก

### ปัญหาที่ 2: กดปุ่ม Pay แล้วสถานะในเว็บไม่เปลี่ยน / ค้าง
*   **สาเหตุ:** ขาดระบบแสดงผลสถานะที่ชัดเจน (UX) และถ้าลูกค้าเปิดบนมือถือหรือเบราว์เซอร์ที่ไม่มี MetaMask ตัว `window.ethereum` จะพัง
*   **วิธีแก้:** ดักจับ Error เสมอ และใส่คำสั่ง `setStatus()` ในทุกๆ ขั้นตอนของการเชื่อมต่อ เพื่อให้รู้ว่าโค้ดติดที่บรรทัดไหน

### ปัญหาที่ 3: Deploy Smart Contract ผ่าน GitHub Actions ไม่ผ่าน (Exit Code 1)
*   **สาเหตุ:** `PRIVATE_KEY` ที่ใส่ใน GitHub Secrets ขาดตัวอักษร `0x` นำหน้า ทำให้ Hardhat ปฏิเสธการทำงานตั้งแต่ต้น
*   **วิธีแก้:** เขียนโค้ดดักจับใน `hardhat.config.js` ให้เช็คว่ามี `0x` หรือไม่ ถ้าไม่มีให้เติมอัตโนมัติ (`process.env.PRIVATE_KEY.startsWith('0x') ? ... : '0x' + ...`)

### ปัญหาที่ 4: Error "403 Forbidden: API key disabled, tenant disabled" ตอนรันเชน
*   **สาเหตุ:** ช่องสัญญาณ (Public RPC) อย่าง `polygon-rpc.com` มีการแบน IP ของเซิร์ฟเวอร์ GitHub Actions เพื่อป้องกันบอทสแปม
*   **วิธีแก้:** เปลี่ยน RPC URL ไปใช้ของผู้ให้บริการที่เสถียรและอนุญาตบอท เช่น `polygon-bor-rpc.publicnode.com`

### ปัญหาที่ 5: Error "nonce too low" ตอน Deploy 2 Contracts ติดต่อกัน
*   **สาเหตุ:** เชน Polygon อัปเดตสถานะคิว (Nonce) บนเซิร์ฟเวอร์ไม่ทันเมื่อสร้าง Contract ติดๆ กันในเสี้ยววินาที
*   **วิธีแก้:** ถ้าเหรียญ (Contract A) ถูก Deploy ไปแล้วรอบแรก ให้คอมเมนต์โค้ดส่วนนั้นทิ้ง นำ Address มาใส่แบบ Hardcoded แล้วกด Deploy แค่ Contract B อย่างเดียว เพื่อลดปัญหาคิวชนกัน

## 4. แผนงานในอนาคต (Future Enhancements)
*   เมื่อพร้อมขายจริง ให้เปลี่ยน `USDC_ADDRESS` ในไฟล์ `Store.jsx` จาก `MockUSDC` ไปเป็น `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` (USDC ของแท้บน Polygon)
*   เพิ่มระบบ "ดูประวัติออเดอร์" สำหรับฝั่งลูกค้า (ดึงข้อมูลด้วย Wallet Address)
*   เพิ่มการแจ้งเตือนผ่าน Email/Line Notify ทันทีที่ลูกค้าโอนเงินและข้อมูลเข้า Database
