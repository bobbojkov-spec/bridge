import MainNav from '@/components/MainNav'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'
import AboutUsHero from '@/components/AboutUsHero'
import AwardsSection from '@/components/AwardsSection'
import TeamSection from '@/components/TeamSection'
import ServicesSection from '@/components/ServicesSection'
import ContactSection from '@/components/ContactSection'

export default function AboutUs() {
  // Static data - will be replaced with CMS data later
  const heroData = {
    title: "ABOUT OUR CREATIVE HOUSE",
    headerText: "Proin gravida nibh vel velit auctor aliquet. Aenean sollicitudin, lorem quis bibendum auctor, nisi elit consequat ipsum, nec sagittis sem nibh id elit.",
    detailText: "Duis sed odio sit amet nibh vulputate cursus a sit amet mauris. Morbi accumsan ipsum velit. Nam nec tellus a odio tincidunt auctor a ornare odio.",
    heroImage: "/images/h3-slide-1.jpg", // Placeholder - replace with actual about us image
    heroImageAlt: "About Our Creative House"
  };

  const awards = [
    { id: "1", title: "kk" },
    { id: "2", title: "kk" },
    { id: "3", title: "kk" },
    { id: "4", title: "kk" },
    { id: "5", title: "kk" },
    { id: "6", title: "kk" },
  ];

  const teamMembers = [
    {
      id: "1",
      name: "Vera Briggs",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit leo, eget eui dolor. In ut ullamcorper leo, eget euismod orci. Cum sociis natoquem ipsum dolor sit amet",
    },
    {
      id: "2",
      name: "Milla Grant",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit leo, eget eui dolor. In ut ullamcorper leo, eget euismod orci. Cum sociis natoquem ipsum dolor sit amet",
    },
  ];

  const services = [
    {
      id: "1",
      title: "what we do",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nec vero pietas adversus deos nec quanta iis gratia debeatur sine explicatione naturae intellegi potest vixtis.",
    },
    {
      id: "2",
      title: "we're already there",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nec vero pietas adversus deos nec quanta iis gratia debeatur sine explicatione naturae intellegi potest vixtis.",
    },
    {
      id: "3",
      title: "The company you keep",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nec vero pietas adversus deos nec quanta iis gratia debeatur sine explicatione naturae intellegi potest vixtis.",
    },
    {
      id: "4",
      title: "Your financial bridge",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nec vero pietas adversus deos nec quanta iis gratia debeatur sine explicatione naturae intellegi potest vixtis.",
    },
  ];

  const contactData = {
    phone: "+1123456789",
    address: "1316 Abbot Kinney Blvd. Copenhagen CA 90291",
  };

  return (
    <div>
      <MainNav />
      <main>
        <AboutUsHero {...heroData} />
        <AwardsSection awards={awards} />
        <TeamSection members={teamMembers} />
        <ServicesSection services={services} />
        <ContactSection {...contactData} />
      </main>
      <Footer />
      <BackToTop />
    </div>
  )
}
